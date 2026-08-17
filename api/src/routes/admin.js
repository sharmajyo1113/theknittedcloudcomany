'use strict';

const express = require('express');
const multer = require('multer');
const { getDb } = require('../lib/firestore');
const { uploadImage } = require('../lib/storage');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth, requireAdmin);

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.post('/upload', upload.single('image'), async (req, res, next) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No image file provided.' });
        if (!req.file.mimetype.startsWith('image/')) {
            return res.status(400).json({ error: 'File must be an image.' });
        }
        const url = await uploadImage(req.file.buffer, req.file.mimetype, req.file.originalname);
        res.json({ url });
    } catch (err) {
        next(err);
    }
});

function slugify(text) {
    return String(text)
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

// ---------------- Dashboard ----------------

router.get('/dashboard', async (req, res, next) => {
    try {
        const db = getDb();
        const [productsSnap, ordersSnap, usersSnap] = await Promise.all([
            db.collection('products').get(),
            db.collection('orders').get(),
            db.collection('users').where('role', '==', 'CUSTOMER').get(),
        ]);

        const orders = ordersSnap.docs.map((d) => d.data());
        const revenue = orders.filter((o) => o.status !== 'CANCELLED').reduce((sum, o) => sum + Number(o.total), 0);
        const statusCounts = {};
        for (const o of orders) statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;

        const products = productsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        const lowStock = products
            .filter((p) => p.isActive && p.stock <= 3)
            .sort((a, b) => a.stock - b.stock)
            .slice(0, 6);

        res.json({
            totalProducts: productsSnap.size,
            totalOrders: ordersSnap.size,
            totalCustomers: usersSnap.size,
            revenue,
            statusCounts,
            lowStock,
        });
    } catch (err) {
        next(err);
    }
});

// ---------------- Products ----------------

router.get('/products', async (req, res, next) => {
    try {
        const db = getDb();
        const snap = await db.collection('products').get();
        const products = snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        const categoryIds = [...new Set(products.map((p) => p.categoryId).filter(Boolean))];
        const categories = new Map();
        await Promise.all(
            categoryIds.map(async (id) => {
                const doc = await db.collection('categories').doc(id).get();
                if (doc.exists) categories.set(id, { id: doc.id, name: doc.data().name, slug: doc.data().slug });
            })
        );

        res.json({ products: products.map((p) => ({ ...p, category: p.categoryId ? categories.get(p.categoryId) || null : null })) });
    } catch (err) {
        next(err);
    }
});

router.post('/products', async (req, res, next) => {
    try {
        const { name, categoryId, sku, description, price, stock, icon, isActive, imagePath } = req.body;
        const slug = slugify(name || '');
        if (!name || !slug) return res.status(400).json({ error: 'Please provide a product name.' });

        const db = getDb();
        const ref = db.collection('products').doc(slug);
        const product = {
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
            createdAt: new Date().toISOString(),
        };

        try {
            await ref.create(product);
        } catch (err) {
            if (err.code === 6 /* ALREADY_EXISTS */) return res.status(400).json({ error: 'A product with that name already exists.' });
            throw err;
        }
        res.status(201).json({ product: { id: ref.id, ...product } });
    } catch (err) {
        next(err);
    }
});

router.patch('/products/:id', async (req, res, next) => {
    try {
        const { name, categoryId, sku, description, price, stock, icon, isActive, imagePath } = req.body;
        const data = {};
        if (name !== undefined) data.name = name;
        if (categoryId !== undefined) data.categoryId = categoryId || null;
        if (sku !== undefined) data.sku = sku;
        if (description !== undefined) data.description = description;
        if (price !== undefined) data.price = Number(price);
        if (stock !== undefined) data.stock = parseInt(stock, 10);
        if (icon !== undefined) data.icon = icon;
        if (isActive !== undefined) data.isActive = Boolean(isActive);
        if (imagePath !== undefined) data.imagePath = imagePath;

        const db = getDb();
        const ref = db.collection('products').doc(req.params.id);
        await ref.update(data);
        const doc = await ref.get();
        res.json({ product: { id: doc.id, ...doc.data() } });
    } catch (err) {
        next(err);
    }
});

router.delete('/products/:id', async (req, res, next) => {
    try {
        const db = getDb();
        const ref = db.collection('products').doc(req.params.id);

        // Hide instead of hard-deleting if the product is referenced by any past
        // order's items (Firestore has no FK constraints to enforce this for us).
        const itemsSnap = await db.collectionGroup('items').where('productId', '==', req.params.id).limit(1).get();
        if (!itemsSnap.empty) {
            await ref.update({ isActive: false });
            return res.json({ ok: true, hidden: true });
        }

        await ref.delete();
        res.json({ ok: true });
    } catch (err) {
        next(err);
    }
});

// ---------------- Categories ----------------

router.get('/categories', async (req, res, next) => {
    try {
        const db = getDb();
        const [categoriesSnap, productsSnap] = await Promise.all([db.collection('categories').get(), db.collection('products').get()]);

        const counts = {};
        for (const doc of productsSnap.docs) {
            const categoryId = doc.data().categoryId;
            if (categoryId) counts[categoryId] = (counts[categoryId] || 0) + 1;
        }

        const categories = categoriesSnap.docs
            .map((d) => ({ id: d.id, ...d.data(), _count: { products: counts[d.id] || 0 } }))
            .sort((a, b) => a.name.localeCompare(b.name));
        res.json({ categories });
    } catch (err) {
        next(err);
    }
});

const CATEGORY_TYPES = ['standard', 'featured', 'new-arrival'];

router.post('/categories', async (req, res, next) => {
    try {
        const { name, description, type, imagePath } = req.body;
        const slug = slugify(name || '');
        if (!name || !slug) return res.status(400).json({ error: 'Please provide a category name.' });
        if (type !== undefined && !CATEGORY_TYPES.includes(type)) {
            return res.status(400).json({ error: `type must be one of: ${CATEGORY_TYPES.join(', ')}.` });
        }

        const db = getDb();
        const ref = db.collection('categories').doc(slug);
        const category = {
            name,
            slug,
            description: description || null,
            type: type || 'standard',
            imagePath: imagePath || null,
        };

        try {
            await ref.create(category);
        } catch (err) {
            if (err.code === 6 /* ALREADY_EXISTS */) return res.status(400).json({ error: 'A category with that name already exists.' });
            throw err;
        }
        res.status(201).json({ category: { id: ref.id, ...category } });
    } catch (err) {
        next(err);
    }
});

router.patch('/categories/:id', async (req, res, next) => {
    try {
        const { name, description, type, imagePath } = req.body;
        if (type !== undefined && !CATEGORY_TYPES.includes(type)) {
            return res.status(400).json({ error: `type must be one of: ${CATEGORY_TYPES.join(', ')}.` });
        }

        const data = {};
        if (name !== undefined) data.name = name;
        if (description !== undefined) data.description = description;
        if (type !== undefined) data.type = type;
        if (imagePath !== undefined) data.imagePath = imagePath;

        const db = getDb();
        const ref = db.collection('categories').doc(req.params.id);
        await ref.update(data);
        const doc = await ref.get();
        res.json({ category: { id: doc.id, ...doc.data() } });
    } catch (err) {
        next(err);
    }
});

router.delete('/categories/:id', async (req, res, next) => {
    try {
        await getDb().collection('categories').doc(req.params.id).delete();
        res.json({ ok: true });
    } catch (err) {
        next(err);
    }
});

// ---------------- Orders ----------------

const VALID_STATUSES = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

async function attachCustomer(db, orders) {
    const userIds = [...new Set(orders.map((o) => o.userId))];
    const users = new Map();
    await Promise.all(
        userIds.map(async (id) => {
            const doc = await db.collection('users').doc(id).get();
            if (doc.exists) users.set(id, { name: doc.data().name, email: doc.data().email });
        })
    );
    return orders.map((o) => ({ ...o, user: users.get(o.userId) || null }));
}

router.get('/orders', async (req, res, next) => {
    try {
        const db = getDb();
        const { status } = req.query;
        let ordersQuery = db.collection('orders');
        if (VALID_STATUSES.includes(status)) ordersQuery = ordersQuery.where('status', '==', status);

        const snap = await ordersQuery.get();
        const orders = snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        res.json({ orders: await attachCustomer(db, orders) });
    } catch (err) {
        next(err);
    }
});

router.get('/orders/:id', async (req, res, next) => {
    try {
        const db = getDb();
        const doc = await db.collection('orders').doc(req.params.id).get();
        if (!doc.exists) return res.status(404).json({ error: 'Order not found.' });

        const itemsSnap = await doc.ref.collection('items').get();
        const [order] = await attachCustomer(db, [{ id: doc.id, ...doc.data() }]);
        order.items = itemsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        res.json({ order });
    } catch (err) {
        next(err);
    }
});

router.patch('/orders/:id', async (req, res, next) => {
    try {
        const { status } = req.body;
        if (!VALID_STATUSES.includes(status)) return res.status(400).json({ error: 'Invalid status.' });

        const db = getDb();
        const ref = db.collection('orders').doc(req.params.id);
        await ref.update({ status });
        const doc = await ref.get();
        res.json({ order: { id: doc.id, ...doc.data() } });
    } catch (err) {
        next(err);
    }
});

// ---------------- Customers ----------------

router.get('/customers', async (req, res, next) => {
    try {
        const db = getDb();
        const [usersSnap, ordersSnap] = await Promise.all([
            db.collection('users').where('role', '==', 'CUSTOMER').get(),
            db.collection('orders').get(),
        ]);

        const ordersByUser = new Map();
        for (const doc of ordersSnap.docs) {
            const o = doc.data();
            if (!ordersByUser.has(o.userId)) ordersByUser.set(o.userId, []);
            ordersByUser.get(o.userId).push(o);
        }

        const customers = usersSnap.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .map((c) => {
                const orders = ordersByUser.get(c.id) || [];
                return {
                    id: c.id,
                    name: c.name,
                    email: c.email,
                    createdAt: c.createdAt,
                    orderCount: orders.length,
                    totalSpent: orders.filter((o) => o.status !== 'CANCELLED').reduce((sum, o) => sum + Number(o.total), 0),
                };
            });

        res.json({ customers });
    } catch (err) {
        next(err);
    }
});

// ---------------- Homepage Slides ----------------

router.get('/slides', async (req, res, next) => {
    try {
        const snap = await getDb().collection('slides').get();
        const slides = snap.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        res.json({ slides });
    } catch (err) {
        next(err);
    }
});

router.post('/slides', async (req, res, next) => {
    try {
        const { eyebrow, title, description, ctaLabel, ctaHref, imagePath, order } = req.body;
        if (!title || !ctaLabel || !ctaHref) {
            return res.status(400).json({ error: 'Please provide a title, CTA label, and CTA link.' });
        }

        const db = getDb();
        const ref = db.collection('slides').doc();
        const slide = {
            eyebrow: eyebrow || '',
            title,
            description: description || '',
            ctaLabel,
            ctaHref,
            imagePath: imagePath || null,
            order: Number.isFinite(order) ? order : Date.now(),
            createdAt: new Date().toISOString(),
        };
        await ref.set(slide);
        res.status(201).json({ slide: { id: ref.id, ...slide } });
    } catch (err) {
        next(err);
    }
});

router.patch('/slides/:id', async (req, res, next) => {
    try {
        const { eyebrow, title, description, ctaLabel, ctaHref, imagePath, order } = req.body;
        const data = {};
        if (eyebrow !== undefined) data.eyebrow = eyebrow;
        if (title !== undefined) data.title = title;
        if (description !== undefined) data.description = description;
        if (ctaLabel !== undefined) data.ctaLabel = ctaLabel;
        if (ctaHref !== undefined) data.ctaHref = ctaHref;
        if (imagePath !== undefined) data.imagePath = imagePath;
        if (order !== undefined) data.order = order;

        const db = getDb();
        const ref = db.collection('slides').doc(req.params.id);
        await ref.update(data);
        const doc = await ref.get();
        res.json({ slide: { id: doc.id, ...doc.data() } });
    } catch (err) {
        next(err);
    }
});

router.delete('/slides/:id', async (req, res, next) => {
    try {
        await getDb().collection('slides').doc(req.params.id).delete();
        res.json({ ok: true });
    } catch (err) {
        next(err);
    }
});

// ---------------- Application Configuration (theme) ----------------

const THEME_FIELDS = ['buttonColor', 'textColor', 'popupColor', 'headerColor', 'footerColor'];
const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

router.get('/theme', async (req, res, next) => {
    try {
        const doc = await getDb().collection('settings').doc('theme').get();
        res.json({ theme: doc.exists ? doc.data() : {} });
    } catch (err) {
        next(err);
    }
});

router.patch('/theme', async (req, res, next) => {
    try {
        const data = {};
        for (const field of THEME_FIELDS) {
            const value = req.body[field];
            if (value === undefined) continue;
            if (value !== null && !HEX_COLOR.test(value)) {
                return res.status(400).json({ error: `${field} must be a hex color like #C4986A.` });
            }
            data[field] = value;
        }
        if (req.body.logoUrl !== undefined) data.logoUrl = req.body.logoUrl;
        const ref = getDb().collection('settings').doc('theme');
        await ref.set(data, { merge: true });
        const doc = await ref.get();
        res.json({ theme: doc.data() });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
