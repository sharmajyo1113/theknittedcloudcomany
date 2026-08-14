'use strict';

const express = require('express');
const { getDb } = require('../lib/firestore');

const router = express.Router();

router.get('/categories', async (req, res, next) => {
    try {
        const snap = await getDb().collection('categories').get();
        const categories = snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => a.name.localeCompare(b.name));
        res.json({ categories });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
