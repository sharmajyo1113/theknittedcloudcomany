'use strict';

const { getStorage } = require('firebase-admin/storage');
const { getFirebaseApp } = require('./firebaseAdmin');

const BUCKET_NAME = process.env.STORAGE_BUCKET || 'theknittedcloudcompany-f2afd-product-images';

function getBucket() {
    return getStorage(getFirebaseApp()).bucket(BUCKET_NAME);
}

// Uploaded filenames (e.g. from a phone's camera roll or a screenshot tool)
// often contain spaces, commas, and other characters that are fragile or
// invalid when embedded raw into a URL — sanitize before using as the
// object's storage path.
function sanitizeFilename(filename) {
    return filename
        .toLowerCase()
        .replace(/[^a-z0-9.]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

async function uploadImage(buffer, mimeType, filename) {
    const bucket = getBucket();
    const objectPath = `products/${Date.now()}-${sanitizeFilename(filename)}`;
    const file = bucket.file(objectPath);
    await file.save(buffer, { metadata: { contentType: mimeType } });
    return `https://storage.googleapis.com/${BUCKET_NAME}/${encodeURIComponent(objectPath).replace(/%2F/g, '/')}`;
}

module.exports = { uploadImage };
