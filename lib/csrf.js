'use strict';

const crypto = require('node:crypto');

function csrfToken(req) {
    if (!req.session.csrf) {
        req.session.csrf = crypto.randomBytes(32).toString('hex');
    }
    return req.session.csrf;
}

/** Makes `csrfToken()` available inside every EJS view (used as `<%- csrfField() %>`). */
function attachCsrfHelper(req, res, next) {
    res.locals.csrfToken = () => csrfToken(req);
    res.locals.csrfField = () =>
        `<input type="hidden" name="csrf" value="${csrfToken(req)}">`;
    next();
}

function verifyCsrf(req, res, next) {
    const token = req.body && req.body.csrf;
    const expected = req.session.csrf;
    const valid =
        typeof token === 'string' &&
        typeof expected === 'string' &&
        token.length === expected.length &&
        crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));

    if (!valid) {
        return res
            .status(400)
            .send('Your session expired or the request looked invalid. Please go back and try again.');
    }
    next();
}

module.exports = { csrfToken, attachCsrfHelper, verifyCsrf };
