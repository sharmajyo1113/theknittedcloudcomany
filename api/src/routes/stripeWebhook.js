'use strict';

const express = require('express');
const { getDb } = require('../lib/firestore');
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

    const db = getDb();

    if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object;
        const snap = await db.collection('orders').where('stripePaymentIntentId', '==', paymentIntent.id).limit(1).get();

        // Already processed (Stripe can redeliver webhooks) or order not found — no-op either way.
        if (!snap.empty && snap.docs[0].data().status === 'PENDING') {
            const orderRef = snap.docs[0].ref;
            const itemsSnap = await orderRef.collection('items').get();

            await db.runTransaction(async (tx) => {
                const productRefs = itemsSnap.docs.filter((d) => d.data().productId).map((d) => db.collection('products').doc(d.data().productId));
                const productDocs = await Promise.all(productRefs.map((ref) => tx.get(ref)));

                for (let i = 0; i < productDocs.length; i++) {
                    const productDoc = productDocs[i];
                    const item = itemsSnap.docs[i].data();
                    if (!productDoc.exists) continue;
                    const currentStock = productDoc.data().stock;
                    if (currentStock >= item.quantity) {
                        tx.update(productRefs[i], { stock: currentStock - item.quantity });
                    }
                }
                tx.update(orderRef, { status: 'PROCESSING' });
            });
        }
    }

    if (event.type === 'payment_intent.payment_failed') {
        const paymentIntent = event.data.object;
        const snap = await db.collection('orders').where('stripePaymentIntentId', '==', paymentIntent.id).limit(1).get();
        if (!snap.empty && snap.docs[0].data().status === 'PENDING') {
            await snap.docs[0].ref.update({ status: 'CANCELLED' });
        }
    }

    res.json({ received: true });
});

module.exports = router;
