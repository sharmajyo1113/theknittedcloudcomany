'use strict';

const express = require('express');
const { prisma } = require('../lib/prisma');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth, requireAdmin);

function slugify(text) {
    return String(text)
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

function num(v) {
    return v === null || v === undefined ? v : Number(v);
}

// ---------------- Dashboard ----------------

router.get('/dashboard', async (req, res, next) => {
    try {
        const [totalProducts, totalOrders, totalCustomers, revenueAgg, statusCounts, lowStock] = await Promise.all([
            prisma.product.count(),
            prisma.order.count(),
            prisma.user.count({ where: { role: 'CUSTOMER' } }),
            prisma.order.aggregate({ _sum: { total: true }, where: { NOT: { status: 'CANCELLED' } } }),
            prisma.order.groupBy({ by: ['status'], _count: true }),
            prisma.product.findMany({ where: { stock: { lte: 3 }, isActive: true }, take: 6, orderBy: { stock: 'asc' } }),
        ]);
        res.json({
            totalProducts,
            totalOrders,
            totalCustomers,
            revenue: num(revenueAgg._sum.total) || 0,
            statusCounts: Object.fromEntries(statusCounts.map((s) => [s.status, s._count])),
            lowStock: lowStock.map((p) => ({ ...p, price: num(p.price) })),
        });
    } catch (err) {
        next(err);
    }
});

// ---------------- Products ----------------

router.get('/products', async (req, res, next) => {
    try {
        const products = await prisma.product.findMany({ include: { category: true }, orderBy: { createdAt: 'desc' } });
        res.json({ products: products.map((p) => ({ ...p, price: num(p.price) })) });
    } catch (err) {
        next(err);
    }
});

router.post('/products', async (req, res, next) => {
    try {
        const { name, categoryId, sku, description, price, stock, icon, isActive, imagePath } = req.body;
        const slug = slugify(name || '');
        if (!name || !slug) return res.status(400).json({ error: 'Please provide a product name.' });

        const product = await prisma.product.create({
            data: {
                name,
                slug,
                categoryId: categoryId || null,
                sku: sku || null,
                description: description || '',
                price: Number(price) || 0,
                stock: parseInt(stock, 10) || 0,
                icon: icon || 'bear',
                isActive: isActive !== false,
                imagePath: imagePath || null,
            },
        });
        res.status(201).json({ product: { ...product, price: num(product.price) } });
    } catch (err) {
        next(err);
    }
});

router.patch('/products/:id', async (req, res, next) => {
    try {
        const { name, categoryId, sku, description, price, stock, icon, isActive, imagePath } = req.body;
        const data = {};
        if (name !== undefined) {
            data.name = name;
            data.slug = slugify(name);
        }
        if (categoryId !== undefined) data.categoryId = categoryId || null;
        if (sku !== undefined) data.sku = sku;
        if (description !== undefined) data.description = description;
        if (price !== undefined) data.price = Number(price);
        if (stock !== undefined) data.stock = parseInt(stock, 10);
        if (icon !== undefined) data.icon = icon;
        if (isActive !== undefined) data.isActive = Boolean(isActive);
        if (imagePath !== undefined) data.imagePath = imagePath;

        const product = await prisma.product.update({ where: { id: req.params.id }, data });
        res.json({ product: { ...product, price: num(product.price) } });
    } catch (err) {
        next(err);
    }
});

router.delete('/products/:id', async (req, res, next) => {
    try {
        await prisma.product.delete({ where: { id: req.params.id } });
        res.json({ ok: true });
    } catch (err) {
        // Likely blocked by an FK from order_items (real past orders) — hide instead of hard-deleting.
        try {
            await prisma.product.update({ where: { id: req.params.id }, data: { isActive: false } });
            return res.json({ ok: true, hidden: true });
        } catch (err2) {
            next(err2);
        }
    }
});

// ---------------- Categories ----------------

router.get('/categories', async (req, res, next) => {
    try {
        const categories = await prisma.category.findMany({
            include: { _count: { select: { products: true } } },
            orderBy: { name: 'asc' },
        });
        res.json({ categories });
    } catch (err) {
        next(err);
    }
});

router.post('/categories', async (req, res, next) => {
    try {
        const { name, description } = req.body;
        const slug = slugify(name || '');
        if (!name || !slug) return res.status(400).json({ error: 'Please provide a category name.' });
        const category = await prisma.category.create({ data: { name, slug, description: description || null } });
        res.status(201).json({ category });
    } catch (err) {
        next(err);
    }
});

router.delete('/categories/:id', async (req, res, next) => {
    try {
        await prisma.category.delete({ where: { id: req.params.id } });
        res.json({ ok: true });
    } catch (err) {
        next(err);
    }
});

// ---------------- Orders ----------------

const VALID_STATUSES = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

router.get('/orders', async (req, res, next) => {
    try {
        const { status } = req.query;
        const where = VALID_STATUSES.includes(status) ? { status } : {};
        const orders = await prisma.order.findMany({
            where,
            include: { user: { select: { name: true, email: true } } },
            orderBy: { createdAt: 'desc' },
        });
        res.json({ orders: orders.map((o) => ({ ...o, subtotal: num(o.subtotal), shippingFee: num(o.shippingFee), total: num(o.total) })) });
    } catch (err) {
        next(err);
    }
});

router.get('/orders/:id', async (req, res, next) => {
    try {
        const order = await prisma.order.findUnique({
            where: { id: req.params.id },
            include: { user: { select: { name: true, email: true } }, items: true },
        });
        if (!order) return res.status(404).json({ error: 'Order not found.' });
        res.json({
            order: {
                ...order,
                subtotal: num(order.subtotal),
                shippingFee: num(order.shippingFee),
                total: num(order.total),
                items: order.items.map((i) => ({ ...i, unitPrice: num(i.unitPrice), lineTotal: num(i.lineTotal) })),
            },
        });
    } catch (err) {
        next(err);
    }
});

router.patch('/orders/:id', async (req, res, next) => {
    try {
        const { status } = req.body;
        if (!VALID_STATUSES.includes(status)) return res.status(400).json({ error: 'Invalid status.' });
        const order = await prisma.order.update({ where: { id: req.params.id }, data: { status } });
        res.json({ order: { ...order, subtotal: num(order.subtotal), shippingFee: num(order.shippingFee), total: num(order.total) } });
    } catch (err) {
        next(err);
    }
});

// ---------------- Customers ----------------

router.get('/customers', async (req, res, next) => {
    try {
        const customers = await prisma.user.findMany({
            where: { role: 'CUSTOMER' },
            include: {
                orders: { select: { total: true, status: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json({
            customers: customers.map((c) => ({
                id: c.id,
                name: c.name,
                email: c.email,
                createdAt: c.createdAt,
                orderCount: c.orders.length,
                totalSpent: c.orders.filter((o) => o.status !== 'CANCELLED').reduce((sum, o) => sum + Number(o.total), 0),
            })),
        });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
