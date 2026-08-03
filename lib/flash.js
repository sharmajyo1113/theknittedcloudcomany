'use strict';

function flashSet(req, type, message) {
    if (!req.session.flash) req.session.flash = [];
    req.session.flash.push({ type, message });
}

/** Moves any queued flash messages into `res.locals.flashMessages` for this render, then clears them. */
function attachFlash(req, res, next) {
    res.locals.flashMessages = req.session.flash || [];
    req.session.flash = [];
    next();
}

module.exports = { flashSet, attachFlash };
