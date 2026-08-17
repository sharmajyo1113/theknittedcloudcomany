'use strict';

const express = require('express');
const { getDb } = require('../lib/firestore');

const router = express.Router();

router.get('/theme', async (req, res, next) => {
    try {
        const doc = await getDb().collection('settings').doc('theme').get();
        res.json({ theme: doc.exists ? doc.data() : {} });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
