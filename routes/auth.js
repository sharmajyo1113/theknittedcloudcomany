'use strict';

const express = require('express');
const { db } = require('../db');
const { hashPassword, verifyPassword, DUMMY_HASH } = require('../lib/password');
const { loginUser, redirectAfterLoginTarget } = require('../lib/auth');
const { verifyCsrf } = require('../lib/csrf');
const { flashSet } = require('../lib/flash');
const { slugify } = require('../lib/helpers');

const router = express.Router();

router.get('/register', (req, res) => {
    if (req.user) return res.redirect('/account');
    res.render('register', { pageTitle: 'Register — The Knitted Cloud Company', errors: [], name: '', email: '' });
});

router.post('/register', verifyCsrf, async (req, res, next) => {
    if (req.user) return res.redirect('/account');

    const name = (req.body.name || '').trim();
    const email = (req.body.email || '').trim();
    const password = req.body.password || '';
    const passwordConfirm = req.body.password_confirm || '';
    const errors = [];

    if (!name) errors.push('Please enter your name.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Please enter a valid email address.');
    if (password.length < 8) errors.push('Password must be at least 8 characters.');
    if (password !== passwordConfirm) errors.push('Passwords do not match.');

    if (!errors.length) {
        const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
        if (existing) errors.push('An account with that email already exists.');
    }

    if (errors.length) {
        return res.render('register', { pageTitle: 'Register — The Knitted Cloud Company', errors, name, email });
    }

    try {
        const hash = hashPassword(password);
        const info = db
            .prepare("INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'customer')")
            .run(name, email, hash);
        const user = { id: Number(info.lastInsertRowid) };

        await loginUser(req, user);
        flashSet(req, 'success', `Welcome, ${name}! Your account has been created.`);
        res.redirect(redirectAfterLoginTarget(req));
    } catch (err) {
        next(err);
    }
});

router.get('/login', (req, res) => {
    if (req.user) return res.redirect('/account');
    res.render('login', { pageTitle: 'Log In — The Knitted Cloud Company', errors: [], email: '' });
});

router.post('/login', verifyCsrf, async (req, res, next) => {
    if (req.user) return res.redirect('/account');

    const email = (req.body.email || '').trim();
    const password = req.body.password || '';

    const user = db.prepare('SELECT id, name, password_hash FROM users WHERE email = ?').get(email);
    // Always run verifyPassword, even with no matching user, so response time doesn't reveal whether the email exists.
    const passwordOk = verifyPassword(password, user ? user.password_hash : DUMMY_HASH);

    if (!user || !passwordOk) {
        return res.render('login', { pageTitle: 'Log In — The Knitted Cloud Company', errors: ['Incorrect email or password.'], email });
    }

    try {
        await loginUser(req, user);
        flashSet(req, 'success', `Welcome back, ${user.name}!`);
        res.redirect(redirectAfterLoginTarget(req));
    } catch (err) {
        next(err);
    }
});

router.get('/logout', (req, res, next) => {
    // Regenerate the session ID (good hygiene on privilege change) but keep the cart —
    // logging out shouldn't throw away items a guest-turned-customer had queued up.
    const cart = req.session.cart;
    req.session.regenerate((err) => {
        if (err) return next(err);
        if (cart) req.session.cart = cart;
        flashSet(req, 'info', "You've been logged out.");
        res.redirect('/');
    });
});

module.exports = router;
