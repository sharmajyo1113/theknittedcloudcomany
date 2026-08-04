'use strict';

const { verifyIdToken } = require('../lib/firebaseAdmin');
const { prisma } = require('../lib/prisma');

/**
 * Verifies the Firebase ID token in `Authorization: Bearer <token>`, then finds
 * (or lazily creates) the matching Postgres User row and attaches it as req.user.
 * A brand-new Firebase sign-in has no Postgres row yet — this is where one is born.
 */
async function requireAuth(req, res, next) {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) {
        return res.status(401).json({ error: 'Missing or invalid Authorization header.' });
    }

    try {
        const decoded = await verifyIdToken(token);
        let user = await prisma.user.findUnique({ where: { firebaseUid: decoded.uid } });

        if (!user) {
            user = await prisma.user.create({
                data: {
                    firebaseUid: decoded.uid,
                    email: decoded.email || `${decoded.uid}@no-email.local`,
                    name: decoded.name || decoded.email || 'Customer',
                },
            });
        }

        req.user = user;
        next();
    } catch (err) {
        res.status(401).json({ error: 'Invalid or expired token.' });
    }
}

function requireAdmin(req, res, next) {
    if (!req.user || req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Admin access required.' });
    }
    next();
}

module.exports = { requireAuth, requireAdmin };
