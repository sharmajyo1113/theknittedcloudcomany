'use strict';

const express = require('express');
const { getDb } = require('../lib/firestore');
const { getStripe } = require('../lib/stripe');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const SHIPPING_FLAT_FEE = 826;
const FREE_SHIPPING_THRESHOLD = 8300;

function serializeOrder(order) {
    return { ...order, items: order.items || [] };
}

async function fetchProductsByIds(db, ids) {
    // Firestore 'in' queries cap at 30 values — carts are always far smaller.
    if (ids.length === 0) return new Map();
    const snap = await db.collection('products').where('__name__', 'in', ids).get();
    return new Map(snap.docs.map((d) => [d.id, { id: d.id, ...d.data() }]));
}

// Creates a pending order + a Stripe PaymentIntent for it. Stock is NOT decremented
// here — only once the webhook confirms the payment actually succeeded, so an
// abandoned checkout never falsely reserves inventory.
router.post('/orders', requireAuth, async (req, res, next) => {
    try {
        const db = getDb();
        const { items, shipping } = req.body;
        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'Your cart is empty.' });
        }
        for (const field of ['name', 'address', 'city', 'postcode', 'phone']) {
            if (!shipping || !shipping[field] || !String(shipping[field]).trim()) {
                return res.status(400).json({ error: `Please provide shipping ${field}.` });
            }
        }

        const productMap = await fetchProductsByIds(db, items.map((i) => i.productId));

        let subtotal = 0;
        const lineItems = [];
        for (const item of items) {
            const product = productMap.get(item.productId);
            const quantity = Math.max(1, parseInt(item.quantity, 10) || 0);
            if (!product || !product.isActive) return res.status(400).json({ error: 'One of the items in your cart is no longer available.' });
            if (quantity > product.stock) {
                return res.status(400).json({ error: `${product.name} only has ${product.stock} left in stock.` });
            }
            const unitPrice = Number(product.price);
            const lineTotal = unitPrice * quantity;
            subtotal += lineTotal;
            lineItems.push({ product, quantity, unitPrice, lineTotal });
        }

        const shippingFee = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT_FEE;
        const total = subtotal + shippingFee;

        const stripe = getStripe();
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(total * 100),
            currency: 'inr',
            metadata: { userId: req.user.id },
        });

        const orderRef = db.collection('orders').doc();
        const orderData = {
            userId: req.user.id,
            status: 'PENDING',
            subtotal,
            shippingFee,
            total,
            shippingName: shipping.name,
            shippingAddress: shipping.address,
            shippingCity: shipping.city,
            shippingPostcode: shipping.postcode,
            shippingPhone: shipping.phone,
            notes: shipping.notes || null,
            paymentMethod: 'stripe',
            stripePaymentIntentId: paymentIntent.id,
            createdAt: new Date().toISOString(),
        };

        const batch = db.batch();
        batch.set(orderRef, orderData);
        for (const li of lineItems) {
            batch.set(orderRef.collection('items').doc(), {
                productId: li.product.id,
                productName: li.product.name,
                unitPrice: li.unitPrice,
                quantity: li.quantity,
                lineTotal: li.lineTotal,
            });
        }
        await batch.commit();

        res.json({ orderId: orderRef.id, clientSecret: paymentIntent.client_secret, total });
    } catch (err) {
        next(err);
    }
});

router.get('/orders', requireAuth, async (req, res, next) => {
    try {
        const snap = await getDb().collection('orders').where('userId', '==', req.user.id).get();
        const orders = snap.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        res.json({ orders: orders.map(serializeOrder) });
    } catch (err) {
        next(err);
    }
});

router.get('/orders/:id', requireAuth, async (req, res, next) => {
    try {
        const db = getDb();
        const doc = await db.collection('orders').doc(req.params.id).get();
        if (!doc.exists || doc.data().userId !== req.user.id) return res.status(404).json({ error: 'Order not found.' });

        const itemsSnap = await doc.ref.collection('items').get();
        const order = { id: doc.id, ...doc.data(), items: itemsSnap.docs.map((d) => ({ id: d.id, ...d.data() })) };
        res.json({ order: serializeOrder(order) });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
