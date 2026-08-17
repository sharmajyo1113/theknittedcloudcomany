'use strict';

require('dotenv/config');
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 4000;

// CORS_ORIGIN is comma-separated so the API can serve the custom domain, its
// www variant, and Firebase Hosting's own *.web.app URL all at once — a
// single fixed origin here previously broke every client-side fetch (admin
// checks, order history, etc.) whenever accessed via a domain other than
// whichever one was hardcoded.
const allowedOrigins = (process.env.CORS_ORIGIN || '*').split(',').map((o) => o.trim());
app.use(cors({ origin: allowedOrigins.includes('*') ? '*' : allowedOrigins }));

// Stripe webhook needs the raw body for signature verification, so it's mounted
// BEFORE express.json() and only that one route skips JSON parsing.
app.use('/api', require('./routes/stripeWebhook'));

app.use(express.json());

app.get('/health', (req, res) => res.json({ ok: true }));

app.use('/api', require('./routes/products'));
app.use('/api', require('./routes/categories'));
app.use('/api', require('./routes/orders'));
app.use('/api/admin', require('./routes/admin'));

app.use((req, res) => res.status(404).json({ error: 'Not found.' }));

app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong on our end.' });
});

app.listen(PORT, () => {
    console.log(`Knitted Cloud API running on http://localhost:${PORT}`);
});
