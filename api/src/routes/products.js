'use strict';

const express = require('express');
const { prisma } = require('../lib/prisma');

const router = express.Router();
const PER_PAGE = 8;

function serializeProduct(p) {
    return {
        ...p,
        price: Number(p.price),
        category: p.category ? { id: p.category.id, name: p.category.name, slug: p.category.slug } : null,
    };
}

router.get('/products', async (req, res, next) => {
    try {
        const { category, q, sort = 'newest', page = '1', minPrice, maxPrice } = req.query;
        const pageNum = Math.max(1, parseInt(page, 10) || 1);

        const where = { isActive: true };
        if (category) where.category = { slug: category };
        if (q) {
            where.OR = [
                { name: { contains: q, mode: 'insensitive' } },
                { description: { contains: q, mode: 'insensitive' } },
            ];
        }
        if (minPrice || maxPrice) {
            where.price = {};
            if (minPrice) where.price.gte = Number(minPrice);
            if (maxPrice) where.price.lte = Number(maxPrice);
        }

        const orderBy =
            { price_asc: { price: 'asc' }, price_desc: { price: 'desc' }, name_asc: { name: 'asc' } }[sort] || {
                createdAt: 'desc',
            };

        const total = await prisma.product.count({ where });
        const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
        const currentPage = Math.min(pageNum, totalPages);

        const products = await prisma.product.findMany({
            where,
            orderBy,
            skip: (currentPage - 1) * PER_PAGE,
            take: PER_PAGE,
            include: { category: true },
        });

        res.json({
            products: products.map(serializeProduct),
            total,
            totalPages,
            page: currentPage,
        });
    } catch (err) {
        next(err);
    }
});

router.get('/products/price-range', async (req, res, next) => {
    try {
        const agg = await prisma.product.aggregate({
            where: { isActive: true },
            _min: { price: true },
            _max: { price: true },
        });
        res.json({ min: Number(agg._min.price) || 0, max: Number(agg._max.price) || 0 });
    } catch (err) {
        next(err);
    }
});

router.get('/products/:slug', async (req, res, next) => {
    try {
        const product = await prisma.product.findFirst({
            where: { slug: req.params.slug, isActive: true },
            include: { category: true },
        });
        if (!product) return res.status(404).json({ error: 'Product not found.' });

        const related = product.categoryId
            ? await prisma.product.findMany({
                  where: { categoryId: product.categoryId, isActive: true, NOT: { id: product.id } },
                  take: 4,
              })
            : [];

        res.json({ product: serializeProduct(product), related: related.map(serializeProduct) });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
