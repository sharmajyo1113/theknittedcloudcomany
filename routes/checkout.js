'use strict';

const express = require('express');
const { db, SHIPPING_FLAT_FEE, FREE_SHIPPING_THRESHOLD } = require('../db');
const { cartItemsDetailed, cartClear } = require('../lib/cart');
const { shippingFeeFor } = require('../lib/helpers');
const { verifyCsrf } = require('../lib/csrf');
const { requireLogin } = require('../lib/auth');
const { flashSet } = require('../lib/flash');

const router = express.Router();

router.get('/checkout', requireLogin, (req, res) => {
    const items = cartItemsDetailed(req);
    if (!items.length) {
        flashSet(req, 'error', 'Your cart is empty.');
        return res.redirect('/cart');
    }
    const subtotal = items.reduce((sum, i) => sum + i.lineTotal, 0);
    const shipping = shippingFeeFor(subtotal, SHIPPING_FLAT_FEE, FREE_SHIPPING_THRESHOLD);

    res.render('checkout', {
        pageTitle: 'Checkout — The Knitted Cloud Company',
        items,
        subtotal,
        shipping,
        errors: [],
        form: { shipping_name: req.user.name, shipping_address: '', shipping_city: '', shipping_postcode: '', shipping_phone: '', notes: '' },
    });
});

router.post('/checkout', requireLogin, verifyCsrf, (req, res, next) => {
    const form = {
        shipping_name: (req.body.shipping_name || '').trim(),
        shipping_address: (req.body.shipping_address || '').trim(),
        shipping_city: (req.body.shipping_city || '').trim(),
        shipping_postcode: (req.body.shipping_postcode || '').trim(),
        shipping_phone: (req.body.shipping_phone || '').trim(),
        notes: (req.body.notes || '').trim(),
    };
    const errors = [];
    if (!form.shipping_name) errors.push('Please enter a recipient name.');
    if (!form.shipping_address) errors.push('Please enter a shipping address.');
    if (!form.shipping_city) errors.push('Please enter a city.');
    if (!form.shipping_postcode) errors.push('Please enter a postcode.');
    if (!form.shipping_phone) errors.push('Please enter a phone number.');

    // Re-fetch cart + prices fresh from the DB right before committing — never trust anything from the client here.
    const items = cartItemsDetailed(req);
    if (!items.length) errors.push('Your cart is empty.');
    for (const item of items) {
        if (item.exceedsStock) {
            errors.push(`${item.product.name} only has ${item.product.stock} left in stock. Please update your cart.`);
        }
    }

    const subtotal = items.reduce((sum, i) => sum + i.lineTotal, 0);
    const shipping = shippingFeeFor(subtotal, SHIPPING_FLAT_FEE, FREE_SHIPPING_THRESHOLD);

    if (errors.length) {
        return res.render('checkout', { pageTitle: 'Checkout — The Knitted Cloud Company', items, subtotal, shipping, errors, form });
    }

    const total = subtotal + shipping;

    db.exec('BEGIN');
    try {
        const orderInfo = db
            .prepare(
                `INSERT INTO orders (user_id, status, subtotal, shipping_fee, total, shipping_name, shipping_address, shipping_city, shipping_postcode, shipping_phone, payment_method, notes)
                 VALUES (?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?, 'cod', ?)`
            )
            .run(req.user.id, subtotal, shipping, total, form.shipping_name, form.shipping_address, form.shipping_city, form.shipping_postcode, form.shipping_phone, form.notes);
        const orderId = Number(orderInfo.lastInsertRowid);

        const insertItem = db.prepare(
            'INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity, line_total) VALUES (?, ?, ?, ?, ?, ?)'
        );
        const decrementStock = db.prepare('UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?');

        for (const item of items) {
            const p = item.product;
            insertItem.run(orderId, p.id, p.name, p.price, item.quantity, item.lineTotal);
            const result = decrementStock.run(item.quantity, p.id, item.quantity);
            if (result.changes === 0) {
                throw new Error(`${p.name} sold out while you were checking out.`);
            }
        }

        db.exec('COMMIT');
        cartClear(req);
        res.redirect(`/order-success/${orderId}`);
    } catch (err) {
        db.exec('ROLLBACK');
        res.render('checkout', {
            pageTitle: 'Checkout — The Knitted Cloud Company',
            items,
            subtotal,
            shipping,
            errors: [err.message],
            form,
        });
    }
});

router.get('/order-success/:id', requireLogin, (req, res) => {
    const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!order) {
        res.status(404);
        return res.render('order_success', { pageTitle: 'Order not found', order: null, items: [] });
    }
    const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
    res.render('order_success', { pageTitle: 'Order Confirmed — The Knitted Cloud Company', order, items });
});

module.exports = router;
