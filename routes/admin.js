'use strict';

const express = require('express');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const multer = require('multer');
const { db } = require('../db');
const { hashPassword, verifyPassword, DUMMY_HASH } = require('../lib/password');
const { requireAdmin, loginUser } = require('../lib/auth');
const { verifyCsrf } = require('../lib/csrf');
const { flashSet } = require('../lib/flash');
const { slugify } = require('../lib/helpers');
const { detectImageType } = require('../lib/imageSniff');

const router = express.Router();

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

// Buffered in memory rather than streamed straight to disk: the client-supplied
// mimetype/extension can't be trusted, so the file has to be fully in hand
// before we sniff its real magic bytes and decide where (and whether) to write it.
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_UPLOAD_BYTES },
});

/** Writes an uploaded buffer to disk under a random name, but only if its content really is
 *  an image — the extension is derived from real magic bytes, never the client's Content-Type. */
function saveUploadedImage(file) {
    const detected = detectImageType(file.buffer);
    if (!detected) return null;
    const filename = crypto.randomBytes(16).toString('hex') + '.' + detected.ext;
    fs.writeFileSync(path.join(UPLOAD_DIR, filename), file.buffer);
    return '/uploads/' + filename;
}

// ---------------- Admin auth (must be reachable without an admin session) ----------------

router.get('/login', (req, res) => {
    if (req.user && req.user.role === 'admin') return res.redirect('/admin');
    res.render('admin/login', { errors: [], email: '' });
});

router.post('/login', verifyCsrf, async (req, res, next) => {
    const email = (req.body.email || '').trim();
    const password = req.body.password || '';

    const user = db.prepare('SELECT id, name, password_hash, role FROM users WHERE email = ?').get(email);
    const passwordOk = verifyPassword(password, user ? user.password_hash : DUMMY_HASH);

    if (!user || !passwordOk) {
        return res.render('admin/login', { errors: ['Incorrect email or password.'], email });
    }
    if (user.role !== 'admin') {
        return res.render('admin/login', { errors: ['This account does not have admin access.'], email });
    }

    try {
        await loginUser(req, user);
        res.redirect('/admin');
    } catch (err) {
        next(err);
    }
});

router.get('/logout', (req, res, next) => {
    req.session.regenerate((err) => (err ? next(err) : res.redirect('/admin/login')));
});

// Everything below requires an authenticated admin.
router.use(requireAdmin);

router.get('/', (req, res) => {
    const totalProducts = db.prepare('SELECT COUNT(*) c FROM products').get().c;
    const totalOrders = db.prepare('SELECT COUNT(*) c FROM orders').get().c;
    const revenue = db.prepare("SELECT COALESCE(SUM(total),0) t FROM orders WHERE status != 'cancelled'").get().t;
    const totalCustomers = db.prepare("SELECT COUNT(*) c FROM users WHERE role = 'customer'").get().c;

    const statusCounts = db.prepare('SELECT status, COUNT(*) c FROM orders GROUP BY status').all();
    const statusMap = Object.fromEntries(statusCounts.map((s) => [s.status, s.c]));

    const lowStock = db.prepare('SELECT * FROM products WHERE stock <= 3 AND is_active = 1 ORDER BY stock ASC LIMIT 6').all();
    const recentOrders = db
        .prepare('SELECT o.*, u.name AS customer_name FROM orders o JOIN users u ON u.id = o.user_id ORDER BY o.created_at DESC LIMIT 6')
        .all();

    res.render('admin/index', {
        pageTitle: 'Dashboard — Admin',
        totalProducts,
        totalOrders,
        revenue,
        totalCustomers,
        statusMap,
        lowStock,
        recentOrders,
        statuses: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
    });
});

// ---------------- Products ----------------

router.get('/products', (req, res) => {
    const products = db
        .prepare('SELECT p.*, c.name AS category_name FROM products p LEFT JOIN categories c ON c.id = p.category_id ORDER BY p.created_at DESC')
        .all();
    res.render('admin/products', { pageTitle: 'Products — Admin', products });
});

function emptyProductForm() {
    return { name: '', category_id: '', sku: '', description: '', price: '', stock: '0', icon: 'bear', is_active: 1 };
}

router.get('/products/new', (req, res) => {
    const categories = db.prepare('SELECT * FROM categories ORDER BY name').all();
    res.render('admin/product_edit', { pageTitle: 'Add Product — Admin', product: null, categories, errors: [], form: emptyProductForm(), imagePath: null });
});

router.get('/products/:id/edit', (req, res) => {
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    if (!product) {
        flashSet(req, 'error', 'Product not found.');
        return res.redirect('/admin/products');
    }
    const categories = db.prepare('SELECT * FROM categories ORDER BY name').all();
    res.render('admin/product_edit', {
        pageTitle: 'Edit Product — Admin',
        product,
        categories,
        errors: [],
        form: {
            name: product.name,
            category_id: product.category_id || '',
            sku: product.sku || '',
            description: product.description || '',
            price: product.price,
            stock: product.stock,
            icon: product.icon,
            is_active: product.is_active,
        },
        imagePath: product.image_path,
    });
});

function saveProduct(req, res, existingId) {
    const categories = db.prepare('SELECT * FROM categories ORDER BY name').all();
    const product = existingId ? db.prepare('SELECT * FROM products WHERE id = ?').get(existingId) : null;

    const form = {
        name: (req.body.name || '').trim(),
        category_id: req.body.category_id ? parseInt(req.body.category_id, 10) : null,
        sku: (req.body.sku || '').trim(),
        description: (req.body.description || '').trim(),
        price: req.body.price,
        stock: req.body.stock,
        icon: ['bear', 'sheep', 'blanket', 'cushion'].includes(req.body.icon) ? req.body.icon : 'bear',
        is_active: req.body.is_active ? 1 : 0,
    };

    const errors = [];
    const price = parseFloat(form.price);
    const stock = parseInt(form.stock, 10);

    if (!form.name) errors.push('Please enter a product name.');
    if (Number.isNaN(price) || price < 0) errors.push('Please enter a valid price.');
    if (Number.isNaN(stock) || stock < 0) errors.push('Please enter a valid stock quantity.');

    const slug = slugify(form.name);
    if (!slug) errors.push('Could not generate a URL slug from that name.');

    if (!errors.length) {
        const dup = db.prepare('SELECT id FROM products WHERE slug = ? AND id != ?').get(slug, existingId || 0);
        if (dup) errors.push('A product with a similar name (same URL slug) already exists.');
    }

    let imagePath = product ? product.image_path : null;
    if (!errors.length && req.fileValidationFailed) {
        errors.push('Image must be a JPEG, PNG, or WebP file under 4MB.');
    } else if (!errors.length && req.file) {
        const saved = saveUploadedImage(req.file);
        if (!saved) {
            errors.push('That file is not a valid JPEG, PNG, or WebP image.');
        } else {
            imagePath = saved;
        }
    }

    if (errors.length) {
        return res.render('admin/product_edit', {
            pageTitle: (product ? 'Edit' : 'Add') + ' Product — Admin',
            product,
            categories,
            errors,
            form,
            imagePath,
        });
    }

    if (product) {
        db.prepare(
            'UPDATE products SET name=?, slug=?, category_id=?, sku=?, description=?, price=?, stock=?, icon=?, is_active=?, image_path=? WHERE id=?'
        ).run(form.name, slug, form.category_id, form.sku, form.description, price, stock, form.icon, form.is_active, imagePath, existingId);
        flashSet(req, 'success', 'Product updated.');
    } else {
        db.prepare(
            'INSERT INTO products (name, slug, category_id, sku, description, price, stock, icon, is_active, image_path) VALUES (?,?,?,?,?,?,?,?,?,?)'
        ).run(form.name, slug, form.category_id, form.sku, form.description, price, stock, form.icon, form.is_active, imagePath);
        flashSet(req, 'success', 'Product created.');
    }
    res.redirect('/admin/products');
}

const handleUpload = (req, res, next) => {
    upload.single('image')(req, res, (err) => {
        if (err instanceof multer.MulterError || err) {
            req.fileValidationFailed = true;
        }
        next();
    });
};

// multer must run first here: it's what parses the multipart body, so verifyCsrf
// has nothing to read from req.body.csrf until handleUpload has already run.
router.post('/products/new', handleUpload, verifyCsrf, (req, res) => saveProduct(req, res, null));
router.post('/products/:id/edit', handleUpload, verifyCsrf, (req, res) => saveProduct(req, res, parseInt(req.params.id, 10)));

router.post('/products/:id/delete', verifyCsrf, (req, res) => {
    try {
        db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
        flashSet(req, 'success', 'Product deleted.');
    } catch (err) {
        // Blocked by the FK from order_items — the product has past orders, so hide it instead of deleting.
        db.prepare('UPDATE products SET is_active = 0 WHERE id = ?').run(req.params.id);
        flashSet(req, 'info', "That product has past orders attached, so it can't be fully deleted — it's been hidden from the store instead.");
    }
    res.redirect('/admin/products');
});

// ---------------- Categories ----------------

router.get('/categories', (req, res) => {
    const categories = db
        .prepare(
            'SELECT c.*, (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id) AS product_count FROM categories c ORDER BY c.name'
        )
        .all();
    res.render('admin/categories', { pageTitle: 'Categories — Admin', categories, errors: [] });
});

router.post('/categories', verifyCsrf, (req, res) => {
    const name = (req.body.name || '').trim();
    const description = (req.body.description || '').trim();
    const slug = slugify(name);

    if (!name || !slug) {
        const categories = db
            .prepare(
                'SELECT c.*, (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id) AS product_count FROM categories c ORDER BY c.name'
            )
            .all();
        return res.render('admin/categories', { pageTitle: 'Categories — Admin', categories, errors: ['Please enter a category name.'] });
    }

    const dup = db.prepare('SELECT id FROM categories WHERE slug = ?').get(slug);
    if (dup) {
        const categories = db
            .prepare(
                'SELECT c.*, (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id) AS product_count FROM categories c ORDER BY c.name'
            )
            .all();
        return res.render('admin/categories', {
            pageTitle: 'Categories — Admin',
            categories,
            errors: ['A category with a similar name already exists.'],
        });
    }

    db.prepare('INSERT INTO categories (name, slug, description) VALUES (?, ?, ?)').run(name, slug, description);
    flashSet(req, 'success', 'Category added.');
    res.redirect('/admin/categories');
});

router.post('/categories/:id/delete', verifyCsrf, (req, res) => {
    db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id);
    flashSet(req, 'success', 'Category deleted. Products in it are now uncategorized.');
    res.redirect('/admin/categories');
});

// ---------------- Orders ----------------

const VALID_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

router.get('/orders', (req, res) => {
    const statusFilter = req.query.status || '';
    let orders;
    if (VALID_STATUSES.includes(statusFilter)) {
        orders = db
            .prepare(
                'SELECT o.*, u.name AS customer_name, u.email AS customer_email FROM orders o JOIN users u ON u.id = o.user_id WHERE o.status = ? ORDER BY o.created_at DESC'
            )
            .all(statusFilter);
    } else {
        orders = db
            .prepare(
                'SELECT o.*, u.name AS customer_name, u.email AS customer_email FROM orders o JOIN users u ON u.id = o.user_id ORDER BY o.created_at DESC'
            )
            .all();
    }
    res.render('admin/orders', { pageTitle: 'Orders — Admin', orders, statusFilter, statuses: VALID_STATUSES });
});

router.get('/orders/:id', (req, res) => {
    const order = db
        .prepare('SELECT o.*, u.name AS customer_name, u.email AS customer_email FROM orders o JOIN users u ON u.id = o.user_id WHERE o.id = ?')
        .get(req.params.id);
    if (!order) {
        flashSet(req, 'error', 'Order not found.');
        return res.redirect('/admin/orders');
    }
    const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
    res.render('admin/order_view', { pageTitle: `Order #${order.id} — Admin`, order, items, statuses: VALID_STATUSES });
});

router.post('/orders/:id', verifyCsrf, (req, res) => {
    const newStatus = req.body.status;
    if (VALID_STATUSES.includes(newStatus)) {
        db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(newStatus, req.params.id);
        flashSet(req, 'success', `Order #${req.params.id} marked as ${newStatus}.`);
    }
    res.redirect(`/admin/orders/${req.params.id}`);
});

// ---------------- Customers ----------------

router.get('/customers', (req, res) => {
    const customers = db
        .prepare(
            `SELECT u.id, u.name, u.email, u.created_at,
                    COUNT(o.id) AS order_count,
                    COALESCE(SUM(CASE WHEN o.status != 'cancelled' THEN o.total ELSE 0 END), 0) AS total_spent
             FROM users u
             LEFT JOIN orders o ON o.user_id = u.id
             WHERE u.role = 'customer'
             GROUP BY u.id
             ORDER BY u.created_at DESC`
        )
        .all();
    res.render('admin/customers', { pageTitle: 'Customers — Admin', customers });
});

module.exports = router;
