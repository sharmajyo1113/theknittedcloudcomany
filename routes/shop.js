'use strict';

const express = require('express');
const { db, SHIPPING_FLAT_FEE, FREE_SHIPPING_THRESHOLD } = require('../db');
const { cartItemsDetailed, cartAdd, cartSetQuantity, cartRemove, cartSubtotal } = require('../lib/cart');
const { shippingFeeFor } = require('../lib/helpers');
const { verifyCsrf } = require('../lib/csrf');
const { flashSet } = require('../lib/flash');

const router = express.Router();
const PER_PAGE = 8;

router.get('/about', (req, res) => {
    res.render('about', { pageTitle: 'Our Story — The Knitted Cloud Company' });
});

router.get('/', (req, res) => {
    const categories = db.prepare('SELECT * FROM categories ORDER BY name').all();
    const categorySlug = req.query.category || '';
    const search = (req.query.q || '').trim();
    const sort = req.query.sort || 'newest';
    let page = Math.max(1, parseInt(req.query.page, 10) || 1);

    let activeCategory = null;
    const where = ['p.is_active = 1'];
    const params = [];

    if (categorySlug) {
        activeCategory = categories.find((c) => c.slug === categorySlug) || null;
        if (activeCategory) {
            where.push('p.category_id = ?');
            params.push(activeCategory.id);
        }
    }
    if (search) {
        where.push('(p.name LIKE ? OR p.description LIKE ?)');
        params.push(`%${search}%`, `%${search}%`);
    }

    const orderBy = { price_asc: 'p.price ASC', price_desc: 'p.price DESC', name_asc: 'p.name ASC' }[sort] || 'p.created_at DESC';
    const whereSql = where.join(' AND ');

    const total = db.prepare(`SELECT COUNT(*) c FROM products p WHERE ${whereSql}`).get(...params).c;
    const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
    page = Math.min(page, totalPages);
    const offset = (page - 1) * PER_PAGE;

    const products = db
        .prepare(`SELECT p.* FROM products p WHERE ${whereSql} ORDER BY ${orderBy} LIMIT ${PER_PAGE} OFFSET ${offset}`)
        .all(...params);

    res.render('index', {
        pageTitle: activeCategory ? `${activeCategory.name} — The Knitted Cloud Company` : 'The Knitted Cloud Company',
        categories,
        activeCategory,
        search,
        sort,
        page,
        totalPages,
        total,
        products,
        query: req.query,
    });
});

router.get('/products/:slug', (req, res) => {
    const product = db
        .prepare(
            `SELECT p.*, c.name AS category_name, c.slug AS category_slug
             FROM products p LEFT JOIN categories c ON c.id = p.category_id
             WHERE p.slug = ? AND p.is_active = 1`
        )
        .get(req.params.slug);

    if (!product) {
        res.status(404);
        return res.render('product', { pageTitle: 'Product not found', product: null, related: [] });
    }

    let related = [];
    if (product.category_id) {
        related = db
            .prepare('SELECT * FROM products WHERE category_id = ? AND id != ? AND is_active = 1 LIMIT 4')
            .all(product.category_id, product.id);
    }

    res.render('product', {
        pageTitle: `${product.name} — The Knitted Cloud Company`,
        product,
        related,
    });
});

router.get('/cart', (req, res) => {
    const items = cartItemsDetailed(req);
    const subtotal = items.reduce((sum, i) => sum + i.lineTotal, 0);
    const shipping = shippingFeeFor(subtotal, SHIPPING_FLAT_FEE, FREE_SHIPPING_THRESHOLD);
    res.render('cart', {
        pageTitle: 'Your Cart — The Knitted Cloud Company',
        items,
        subtotal,
        shipping,
        FREE_SHIPPING_THRESHOLD,
    });
});

router.post('/cart/add', verifyCsrf, (req, res) => {
    const productId = parseInt(req.body.product_id, 10) || 0;
    const qty = Math.max(1, parseInt(req.body.quantity, 10) || 1);
    const redirect = safeRedirect(req.body.redirect, '/cart');

    const product = db.prepare('SELECT id, name, stock FROM products WHERE id = ? AND is_active = 1').get(productId);
    if (!product) {
        flashSet(req, 'error', 'That product is no longer available.');
        return res.redirect(redirect);
    }

    const existingQty = (req.session.cart || {})[productId] || 0;
    const newQty = Math.min(existingQty + qty, product.stock);
    if (newQty <= existingQty) {
        flashSet(req, 'error', `Sorry, there is no more stock available for ${product.name}.`);
    } else {
        cartSetQuantity(req, productId, newQty);
        flashSet(req, 'success', `${product.name} was added to your cart.`);
    }
    res.redirect(redirect);
});

router.post('/cart/update', verifyCsrf, (req, res) => {
    const productId = parseInt(req.body.product_id, 10) || 0;
    let qty = parseInt(req.body.quantity, 10) || 0;
    const redirect = safeRedirect(req.body.redirect, '/cart');

    if (qty > 0) {
        const product = db.prepare('SELECT stock FROM products WHERE id = ?').get(productId);
        if (product) qty = Math.min(qty, product.stock);
    }
    cartSetQuantity(req, productId, qty);
    flashSet(req, 'success', 'Cart updated.');
    res.redirect(redirect);
});

router.post('/cart/remove', verifyCsrf, (req, res) => {
    const productId = parseInt(req.body.product_id, 10) || 0;
    const redirect = safeRedirect(req.body.redirect, '/cart');
    cartRemove(req, productId);
    flashSet(req, 'success', 'Item removed from your cart.');
    res.redirect(redirect);
});

function safeRedirect(target, fallback) {
    if (typeof target === 'string' && target.startsWith('/') && !target.startsWith('//')) return target;
    return fallback;
}

module.exports = router;
