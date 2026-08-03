'use strict';

const path = require('node:path');
const fs = require('node:fs');
const { DatabaseSync } = require('node:sqlite');
const { hashPassword } = require('./lib/password');

const DB_PATH = path.join(__dirname, 'data', 'knittedcloud.sqlite');
// Prices are in Indian Rupees (₹). Converted from the original USD pricing at ~₹83/$1.
const SHIPPING_FLAT_FEE = 826;
const FREE_SHIPPING_THRESHOLD = 8300;

const isNew = !fs.existsSync(DB_PATH);
const db = new DatabaseSync(DB_PATH);
db.exec('PRAGMA foreign_keys = ON');

if (isNew) {
    initSchema();
    seedData();
}

function initSchema() {
    db.exec(`
        CREATE TABLE users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'customer',
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            slug TEXT NOT NULL UNIQUE,
            description TEXT
        );

        CREATE TABLE products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
            name TEXT NOT NULL,
            slug TEXT NOT NULL UNIQUE,
            sku TEXT,
            description TEXT NOT NULL DEFAULT '',
            price REAL NOT NULL,
            stock INTEGER NOT NULL DEFAULT 0,
            image_path TEXT,
            icon TEXT NOT NULL DEFAULT 'bear',
            is_active INTEGER NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL REFERENCES users(id),
            status TEXT NOT NULL DEFAULT 'pending',
            subtotal REAL NOT NULL,
            shipping_fee REAL NOT NULL DEFAULT 0,
            total REAL NOT NULL,
            shipping_name TEXT NOT NULL,
            shipping_address TEXT NOT NULL,
            shipping_city TEXT NOT NULL,
            shipping_postcode TEXT NOT NULL,
            shipping_phone TEXT NOT NULL,
            payment_method TEXT NOT NULL DEFAULT 'cod',
            notes TEXT,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE order_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
            product_id INTEGER REFERENCES products(id),
            product_name TEXT NOT NULL,
            unit_price REAL NOT NULL,
            quantity INTEGER NOT NULL,
            line_total REAL NOT NULL
        );

        CREATE INDEX idx_products_category ON products(category_id);
        CREATE INDEX idx_orders_user ON orders(user_id);
        CREATE INDEX idx_order_items_order ON order_items(order_id);
    `);
}

function seedData() {
    const adminHash = hashPassword('AdminPass123');
    db.prepare("INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'admin')")
        .run('Studio Admin', 'admin@theknittedcloudcompany.com', adminHash);

    const demoHash = hashPassword('Password123');
    db.prepare("INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'customer')")
        .run('Demo Customer', 'customer@example.com', demoHash);

    const categories = [
        ['Knitted Toys', 'knitted-toys', 'Bears, bunnies and friends, hand cast one at a time.'],
        ['Blankets & Throws', 'blankets-throws', 'Cot to cuddle-size, knitted from natural fibres.'],
        ['Nursery Sets', 'nursery-sets', 'Mobiles, bassinet linen and soft nursery decor.'],
        ['Gift Bundles', 'gift-bundles', 'Ready-to-wrap sets for baby showers and birthdays.'],
    ];
    const catStmt = db.prepare('INSERT INTO categories (name, slug, description) VALUES (?, ?, ?)');
    const catIds = {};
    for (const c of categories) {
        const info = catStmt.run(...c);
        catIds[c[0]] = Number(info.lastInsertRowid);
    }

    // Prices in ₹, converted from the original USD amounts at ~₹83/$1.
    const products = [
        ['Wilfred the Bear', 'wilfred-the-bear', catIds['Knitted Toys'], 'WB-001',
            'Undyed merino, 28cm. Hand-knitted with embroidered features and every seam woven in so nothing comes loose.',
            5644, 14, 'bear'],
        ['Marlow the Sheep', 'marlow-the-sheep', catIds['Knitted Toys'], 'WB-002',
            "Bouclé wool, 24cm. A looped fleece texture knitted over a soft-stuffed body.",
            5146, 9, 'sheep'],
        ['Hazel the Bunny', 'hazel-the-bunny', catIds['Knitted Toys'], 'WB-003',
            'Organic cotton, 26cm, with long floppy ears and an embroidered face.',
            4814, 11, 'bear'],
        ['Overcast Cot Blanket', 'overcast-cot-blanket', catIds['Blankets & Throws'], 'WB-010',
            'Organic cotton, 90x120cm, knitted in a soft stockinette weave with a hand-tied fringe.',
            7968, 20, 'blanket'],
        ['Dawn Ridge Throw', 'dawn-ridge-throw', catIds['Blankets & Throws'], 'WB-011',
            'Chunky merino throw, 130x170cm, for the whole family to share.',
            12284, 7, 'blanket'],
        ['Cloud Cushion Trio', 'cloud-cushion-trio', catIds['Nursery Sets'], 'WB-020',
            'Set of 3 cloud-shaped cushions, cotton blend with piped edges.',
            6972, 16, 'cushion'],
        ['Drifting Clouds Mobile', 'drifting-clouds-mobile', catIds['Nursery Sets'], 'WB-021',
            'Hand-knitted cloud mobile for cot or bassinet, natural beechwood ring.',
            5976, 10, 'cushion'],
        ['New Arrival Gift Set', 'new-arrival-gift-set', catIds['Gift Bundles'], 'WB-030',
            'Wilfred the Bear and the Overcast Cot Blanket, boxed and ribboned, ready to gift.',
            12450, 8, 'bear'],
    ];
    const prodStmt = db.prepare(
        `INSERT INTO products (name, slug, category_id, sku, description, price, stock, icon)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    );
    for (const p of products) prodStmt.run(...p);
}

module.exports = { db, SHIPPING_FLAT_FEE, FREE_SHIPPING_THRESHOLD };
