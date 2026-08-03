'use strict';

const { db } = require('../db');

function getUserById(id) {
    return db.prepare('SELECT id, name, email, role FROM users WHERE id = ?').get(id) || null;
}

/** Attaches req.user (or null) and makes it available to every EJS view as `user`. */
function attachCurrentUser(req, res, next) {
    req.user = req.session.userId ? getUserById(req.session.userId) : null;
    res.locals.user = req.user;
    next();
}

function requireLogin(req, res, next) {
    if (!req.user) {
        req.session.redirectAfterLogin = req.originalUrl;
        return res.redirect('/login');
    }
    next();
}

function requireAdmin(req, res, next) {
    if (!req.user || req.user.role !== 'admin') {
        return res.redirect('/admin/login');
    }
    next();
}

/**
 * Logs a user in: regenerates the session ID (prevents session fixation) while
 * preserving the guest cart the visitor already built up, then stores the user id.
 * Returns a Promise since express-session's regenerate() is callback-based.
 */
function loginUser(req, user) {
    // regenerate() wipes the whole session, so anything the pre-login session
    // was carrying — the guest's cart, where to send them back to — must be
    // captured now and restored after, or it's silently lost.
    const cart = req.session.cart;
    const redirectAfterLogin = req.session.redirectAfterLogin;
    return new Promise((resolve, reject) => {
        req.session.regenerate((err) => {
            if (err) return reject(err);
            req.session.userId = user.id;
            if (cart) req.session.cart = cart;
            if (redirectAfterLogin) req.session.redirectAfterLogin = redirectAfterLogin;
            req.session.save((err2) => (err2 ? reject(err2) : resolve()));
        });
    });
}

function redirectAfterLoginTarget(req) {
    const target = req.session.redirectAfterLogin;
    delete req.session.redirectAfterLogin;
    if (typeof target === 'string' && target.startsWith('/') && !target.startsWith('//')) {
        return target;
    }
    return '/account';
}

module.exports = { attachCurrentUser, requireLogin, requireAdmin, loginUser, redirectAfterLoginTarget };
