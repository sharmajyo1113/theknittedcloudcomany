'use strict';

const express = require('express');
const { getDb } = require('../lib/firestore');

const router = express.Router();

router.get('/slides', async (req, res, next) => {
    try {
        const snap = await getDb().collection('slides').get();
        const slides = snap.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        res.json({ slides });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
