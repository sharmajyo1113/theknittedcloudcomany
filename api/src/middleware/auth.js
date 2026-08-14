'use strict';

const { verifyIdToken } = require('../lib/firebaseAdmin');
const { getDb } = require('../lib/firestore');

/**
 * Verifies the Firebase ID token in `Authorization: Bearer <token>`, then finds
 * (or lazily creates) the matching Firestore user doc and attaches it as req.user.
 * A brand-new Firebase sign-in has no Firestore doc yet — this is where one is born.
 * Doc ID is the Firebase UID itself, so lookup is a direct get, no query needed.
 */
async function requireAuth(req, res, next) {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) {
        return res.status(401).json({ error: 'Missing or invalid Authorization header.' });
    }

    try {
        const decoded = await verifyIdToken(token);
        const db = getDb();
        const ref = db.collection('users').doc(decoded.uid);
        const snap = await ref.get();

        let user;
        if (snap.exists) {
            user = { id: snap.id, ...snap.data() };
        } else {
            const data = {
                firebaseUid: decoded.uid,
                email: decoded.email || `${decoded.uid}@no-email.local`,
                name: decoded.name || decoded.email || 'Customer',
                role: 'CUSTOMER',
                createdAt: new Date().toISOString(),
            };
            await ref.set(data);
            user = { id: decoded.uid, ...data };
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
