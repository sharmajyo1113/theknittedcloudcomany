'use strict';

const path = require('node:path');
const crypto = require('node:crypto');
const express = require('express');
const session = require('express-session');

const { attachCurrentUser } = require('./lib/auth');
const { attachCsrfHelper } = require('./lib/csrf');
const { attachFlash } = require('./lib/flash');
const { cartCount } = require('./lib/cart');
const { money, productIconSvg, productIconDefs } = require('./lib/helpers');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Helpers available in every EJS template without each route passing them explicitly.
app.locals.money = money;
app.locals.productIconSvg = productIconSvg;
app.locals.productIconDefs = productIconDefs;

app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(
    session({
        // Regenerated each process start — fine for this dev/demo app; set a fixed
        // SESSION_SECRET env var if you need logins to survive a server restart.
        secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex'),
        resave: false,
        saveUninitialized: false,
        cookie: { httpOnly: true, sameSite: 'lax' },
    })
);

app.use(attachCurrentUser);
app.use(attachCsrfHelper);
app.use(attachFlash);
app.use((req, res, next) => {
    res.locals.cartCount = cartCount(req);
    res.locals.currentPath = req.path;
    next();
});

app.use(require('./routes/shop'));
app.use(require('./routes/auth'));
app.use(require('./routes/checkout'));
app.use(require('./routes/account'));
app.use('/admin', require('./routes/admin'));

app.use((req, res) => {
    res.status(404).send('Page not found.');
});

app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).send('Something went wrong on our end. Please try again.');
});

app.listen(PORT, () => {
    console.log(`The Knitted Cloud Company (Node) running at http://localhost:${PORT}`);
});
