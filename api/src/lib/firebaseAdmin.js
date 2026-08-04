'use strict';

const admin = require('firebase-admin');
const { getAuth } = require('firebase-admin/auth');

let app = null;

/**
 * Lazily initializes firebase-admin from env vars, so the rest of the API
 * (products, categories, etc.) can still run even before Firebase credentials
 * are configured — auth-protected routes will just fail clearly until then.
 */
function getFirebaseApp() {
    if (app) return app;

    const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } = process.env;
    if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
        throw new Error(
            'Firebase Admin is not configured. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY.'
        );
    }

    // firebase-admin v14 flattened this API: admin.cert() directly, not the
    // older admin.credential.cert() from earlier major versions.
    app = admin.initializeApp({
        credential: admin.cert({
            projectId: FIREBASE_PROJECT_ID,
            clientEmail: FIREBASE_CLIENT_EMAIL,
            // .env files can't hold real newlines in a single-line value, so the
            // private key is stored with literal "\n" and unescaped here.
            privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
    });
    return app;
}

async function verifyIdToken(idToken) {
    return getAuth(getFirebaseApp()).verifyIdToken(idToken);
}

module.exports = { verifyIdToken };
