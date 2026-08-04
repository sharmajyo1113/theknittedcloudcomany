'use strict';

require('dotenv/config');
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));

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
