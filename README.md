# The Knitted Cloud Company — Node.js Edition

A Node.js + Express port of the PHP e-commerce app in the parent directory.
Same features, same database shape, same brand — different stack.

## Stack

- **Express 5** — routing/middleware
- **EJS** — templates (1:1 port of the PHP views)
- **`node:sqlite`** — Node's built-in SQLite module (stable in Node 22.5+/24). No
  native compilation, no external database server, no `better-sqlite3` — the
  database is a single file created automatically on first run.
- **express-session** — cookies/session (in-memory store; fine for a single dev
  process, see note below for production)
- **multer** — multipart form parsing for admin product-image uploads
- Password hashing via Node's built-in `crypto.scrypt` — no bcrypt/argon2
  package needed either.

Only 4 npm packages total, and none of them require a native build step.

## Requirements

Node.js 22.5+ (built with `node:sqlite` support). This was built and tested on
Node 24.

## Running it

```
npm install
npm start
```

Then open http://localhost:3000. The first request creates
`data/knittedcloud.sqlite` and seeds it with the same categories, products,
and accounts as the PHP version:

| Role     | Email                              | Password       |
|----------|-------------------------------------|----------------|
| Admin    | admin@theknittedcloudcompany.com    | AdminPass123   |
| Customer | customer@example.com                | Password123    |

- Storefront: http://localhost:3000/
- Admin panel: http://localhost:3000/admin/login

## What's different from the PHP version

- Routes are idiomatic Express paths (`/products/:slug`, `/account/orders/:id`)
  rather than `product.php?slug=`, but the pages and flow are the same.
- Sessions are in-memory by default (`express-session`'s `MemoryStore`), which
  is fine for local use but isn't meant for a multi-process production
  deployment — swap in `connect-sqlite3` or Redis if you deploy this for real.
- The session secret is randomly generated on every process start
  (`server.js`), so restarting the server logs everyone out. Set a
  `SESSION_SECRET` env var if you want sessions to survive restarts.

Everything else — schema, seed data, CSRF protection, stock-safe checkout
transaction, password hashing approach, admin/customer separation — mirrors
the PHP version directly.

## Notes from testing

Two bugs were caught and fixed while porting (worth knowing if you extend
this further):

1. `req.session.regenerate()` (called on login, for session-fixation safety)
   wipes the *entire* session — including where to redirect back to after
   login. `lib/auth.js`'s `loginUser()` explicitly re-attaches the cart and
   the pending redirect target after regenerating.
2. For the multipart (file upload) admin routes, CSRF verification must run
   **after** multer parses the body — `express.urlencoded()` doesn't touch
   multipart requests, so `req.body.csrf` is empty until multer has run.
   `routes/admin.js` orders `handleUpload` before `verifyCsrf` on those two
   routes specifically.
3. The first version of the image-upload validation only checked the
   client-supplied `Content-Type` header (multer's `file.mimetype`) — trivially
   spoofable, so a `.txt` file lying about being `image/png` was accepted and
   saved with a `.png` extension. The PHP version avoided this by sniffing
   real file content with `finfo_file()`. Fixed by switching multer to
   `memoryStorage()` and adding `lib/imageSniff.js`, which checks actual magic
   bytes (PNG/JPEG/WebP signatures) before anything is written to disk —
   confirmed by testing a spoofed upload before and after the fix.
