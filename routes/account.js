'use strict';

const express = require('express');
const { db } = require('../db');
const { requireLogin } = require('../lib/auth');

const router = express.Router();

router.get('/account', requireLogin, (req, res) => {
    const recentOrders = db
        .prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC LIMIT 5')
        .all(req.user.id);
    res.render('account/index', { pageTitle: 'My Account — The Knitted Cloud Company', recentOrders });
});

router.get('/account/orders', requireLogin, (req, res) => {
    const orders = db.prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
    res.render('account/orders', { pageTitle: 'Order History — The Knitted Cloud Company', orders });
});

router.get('/account/orders/:id', requireLogin, (req, res) => {
    const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!order) {
        res.status(404);
        return res.render('account/order', { pageTitle: 'Order not found', order: null, items: [] });
    }
    const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
    res.render('account/order', { pageTitle: `Order #${order.id} — The Knitted Cloud Company`, order, items });
});

module.exports = router;
