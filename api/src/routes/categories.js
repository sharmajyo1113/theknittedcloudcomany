'use strict';

const express = require('express');
const { prisma } = require('../lib/prisma');

const router = express.Router();

router.get('/categories', async (req, res, next) => {
    try {
        const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });
        res.json({ categories });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
