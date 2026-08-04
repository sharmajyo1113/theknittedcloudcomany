'use strict';

const express = require('express');
const { prisma } = require('../lib/prisma');
const { getStripe } = require('../lib/stripe');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const SHIPPING_FLAT_FEE = 826;
const FREE_SHIPPING_THRESHOLD = 8300;

function serializeOrder(order) {
    return {
        ...order,
        subtotal: Number(order.subtotal),
        shippingFee: Number(order.shippingFee),
        total: Number(order.total),
        items: (order.items || []).map((i) => ({
            ...i,
            unitPrice: Number(i.unitPrice),
            lineTotal: Number(i.lineTotal),
        })),
    };
}

// Creates a pending order + a Stripe PaymentIntent for it. Stock is NOT decremented
// here — only once the webhook confirms the payment actually succeeded, so an
// abandoned checkout never falsely reserves inventory.
router.post('/orders', requireAuth, async (req, res, next) => {
    try {
        const { items, shipping } = req.body;
        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'Your cart is empty.' });
        }
        for (const field of ['name', 'address', 'city', 'postcode', 'phone']) {
            if (!shipping || !shipping[field] || !String(shipping[field]).trim()) {
                return res.status(400).json({ error: `Please provide shipping ${field}.` });
            }
        }

        const productIds = items.map((i) => i.productId);
        const products = await prisma.product.findMany({ where: { id: { in: productIds }, isActive: true } });
        const productMap = new Map(products.map((p) => [p.id, p]));

        let subtotal = 0;
        const lineItems = [];
        for (const item of items) {
            const product = productMap.get(item.productId);
            const quantity = Math.max(1, parseInt(item.quantity, 10) || 0);
            if (!product) return res.status(400).json({ error: 'One of the items in your cart is no longer available.' });
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

        const order = await prisma.order.create({
            data: {
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
                items: {
                    create: lineItems.map((li) => ({
                        productId: li.product.id,
                        productName: li.product.name,
                        unitPrice: li.unitPrice,
                        quantity: li.quantity,
                        lineTotal: li.lineTotal,
                    })),
                },
            },
        });

        res.json({ orderId: order.id, clientSecret: paymentIntent.client_secret, total });
    } catch (err) {
        next(err);
    }
});

router.get('/orders', requireAuth, async (req, res, next) => {
    try {
        const orders = await prisma.order.findMany({
            where: { userId: req.user.id },
            orderBy: { createdAt: 'desc' },
        });
        res.json({ orders: orders.map(serializeOrder) });
    } catch (err) {
        next(err);
    }
});

router.get('/orders/:id', requireAuth, async (req, res, next) => {
    try {
        const order = await prisma.order.findFirst({
            where: { id: req.params.id, userId: req.user.id },
            include: { items: true },
        });
        if (!order) return res.status(404).json({ error: 'Order not found.' });
        res.json({ order: serializeOrder(order) });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
