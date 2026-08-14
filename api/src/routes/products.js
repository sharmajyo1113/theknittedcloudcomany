'use strict';

const express = require('express');
const { getDb } = require('../lib/firestore');

const router = express.Router();
const PER_PAGE = 8;

// Firestore doesn't support case-insensitive `contains` or combining arbitrary
// equality + range filters without composite indexes, and the catalog here is
// small — so we fetch active products once and filter/sort/paginate in memory
// rather than fighting Firestore's query model.
async function fetchActiveProducts(db) {
    const snap = await db.collection('products').where('isActive', '==', true).get();
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

async function attachCategory(db, products) {
    const categoryIds = [...new Set(products.map((p) => p.categoryId).filter(Boolean))];
    const categories = new Map();
    await Promise.all(
        categoryIds.map(async (id) => {
            const doc = await db.collection('categories').doc(id).get();
            if (doc.exists) categories.set(id, { id: doc.id, name: doc.data().name, slug: doc.data().slug });
        })
    );
    return products.map((p) => ({ ...p, category: p.categoryId ? categories.get(p.categoryId) || null : null }));
}

router.get('/products', async (req, res, next) => {
    try {
        const db = getDb();
        const { category, q, sort = 'newest', page = '1', minPrice, maxPrice } = req.query;
        const pageNum = Math.max(1, parseInt(page, 10) || 1);

        let products = await fetchActiveProducts(db);

        if (category) products = products.filter((p) => p.categoryId === category);
        if (q) {
            const needle = String(q).toLowerCase();
            products = products.filter(
                (p) => p.name.toLowerCase().includes(needle) || (p.description || '').toLowerCase().includes(needle)
            );
        }
        if (minPrice) products = products.filter((p) => p.price >= Number(minPrice));
        if (maxPrice) products = products.filter((p) => p.price <= Number(maxPrice));

        const comparators = {
            price_asc: (a, b) => a.price - b.price,
            price_desc: (a, b) => b.price - a.price,
            name_asc: (a, b) => a.name.localeCompare(b.name),
        };
        products.sort(comparators[sort] || ((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));

        const total = products.length;
        const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
        const currentPage = Math.min(pageNum, totalPages);
        const pageProducts = products.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

        res.json({
            products: await attachCategory(db, pageProducts),
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
        const db = getDb();
        const products = await fetchActiveProducts(db);
        if (products.length === 0) return res.json({ min: 0, max: 0 });
        const prices = products.map((p) => p.price);
        res.json({ min: Math.min(...prices), max: Math.max(...prices) });
    } catch (err) {
        next(err);
    }
});

router.get('/products/:slug', async (req, res, next) => {
    try {
        const db = getDb();
        const doc = await db.collection('products').doc(req.params.slug).get();
        if (!doc.exists || !doc.data().isActive) return res.status(404).json({ error: 'Product not found.' });

        const product = { id: doc.id, ...doc.data() };

        let related = [];
        if (product.categoryId) {
            const snap = await db.collection('products').where('categoryId', '==', product.categoryId).where('isActive', '==', true).get();
            related = snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((p) => p.id !== product.id).slice(0, 4);
        }

        const [serializedProduct] = await attachCategory(db, [product]);
        res.json({ product: serializedProduct, related: await attachCategory(db, related) });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
