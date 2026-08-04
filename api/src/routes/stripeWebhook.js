'use strict';

const express = require('express');
const { prisma } = require('../lib/prisma');
const { getStripe } = require('../lib/stripe');

const router = express.Router();

// express.raw(), not express.json() — Stripe's signature verification needs the
// exact raw request bytes, which JSON parsing would otherwise destroy. Applied
// directly on this route so it stays correct regardless of mount order in index.js.
router.post('/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const stripe = getStripe();
    const signature = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, signature, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        return res.status(400).send(`Webhook signature verification failed: ${err.message}`);
    }

    if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object;
        const order = await prisma.order.findFirst({
            where: { stripePaymentIntentId: paymentIntent.id },
            include: { items: true },
        });

        // Already processed (Stripe can redeliver webhooks) or order not found — no-op either way.
        if (order && order.status === 'PENDING') {
            await prisma.$transaction(async (tx) => {
                for (const item of order.items) {
                    if (!item.productId) continue;
                    await tx.product.updateMany({
                        where: { id: item.productId, stock: { gte: item.quantity } },
                        data: { stock: { decrement: item.quantity } },
                    });
                }
                await tx.order.update({ where: { id: order.id }, data: { status: 'PROCESSING' } });
            });
        }
    }

    if (event.type === 'payment_intent.payment_failed') {
        const paymentIntent = event.data.object;
        await prisma.order.updateMany({
            where: { stripePaymentIntentId: paymentIntent.id, status: 'PENDING' },
            data: { status: 'CANCELLED' },
        });
    }

    res.json({ received: true });
});

module.exports = router;
