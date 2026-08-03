'use strict';

// Zero-dependency password hashing using Node's built-in scrypt (no bcrypt/argon2 package needed).
const crypto = require('node:crypto');

const KEY_LENGTH = 64;

function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(password, salt, KEY_LENGTH).toString('hex');
    return `scrypt:${salt}:${hash}`;
}

function verifyPassword(password, stored) {
    if (typeof stored !== 'string' || !stored.startsWith('scrypt:')) return false;
    const [, salt, hash] = stored.split(':');
    if (!salt || !hash) return false;
    const candidate = crypto.scryptSync(password, salt, KEY_LENGTH);
    const expected = Buffer.from(hash, 'hex');
    if (candidate.length !== expected.length) return false;
    return crypto.timingSafeEqual(candidate, expected);
}

// A syntactically valid but unmatchable hash, so login can always run verifyPassword()
// even when no such user exists — keeps response time from leaking whether an email is registered.
const DUMMY_HASH = `scrypt:${'0'.repeat(32)}:${'0'.repeat(KEY_LENGTH * 2)}`;

module.exports = { hashPassword, verifyPassword, DUMMY_HASH };
