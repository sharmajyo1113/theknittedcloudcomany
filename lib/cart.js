'use strict';

const { db } = require('../db');

function getCart(req) {
    return req.session.cart || {};
}

function cartCount(req) {
    return Object.values(getCart(req)).reduce((sum, qty) => sum + qty, 0);
}

function cartAdd(req, productId, qty = 1) {
    const cart = req.session.cart || (req.session.cart = {});
    cart[productId] = (cart[productId] || 0) + Math.max(1, qty);
}

function cartSetQuantity(req, productId, qty) {
    const cart = req.session.cart || (req.session.cart = {});
    if (qty <= 0) {
        delete cart[productId];
    } else {
        cart[productId] = qty;
    }
}

function cartRemove(req, productId) {
    if (req.session.cart) delete req.session.cart[productId];
}

function cartClear(req) {
    req.session.cart = {};
}

/** Cart rows joined with live product data; flags items whose stock can't cover the requested qty. */
function cartItemsDetailed(req) {
    const cart = getCart(req);
    const ids = Object.keys(cart).map(Number);
    if (!ids.length) return [];

    const placeholders = ids.map(() => '?').join(',');
    const products = db.prepare(`SELECT * FROM products WHERE id IN (${placeholders})`).all(...ids);

    return products.map((p) => {
        const quantity = cart[p.id];
        return {
            product: p,
            quantity,
            lineTotal: p.price * quantity,
            exceedsStock: quantity > p.stock,
        };
    });
}

function cartSubtotal(req) {
    return cartItemsDetailed(req).reduce((sum, item) => sum + item.lineTotal, 0);
}

module.exports = {
    getCart,
    cartCount,
    cartAdd,
    cartSetQuantity,
    cartRemove,
    cartClear,
    cartItemsDetailed,
    cartSubtotal,
};
