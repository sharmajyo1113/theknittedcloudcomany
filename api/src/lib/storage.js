'use strict';

const { getStorage } = require('firebase-admin/storage');
const { getFirebaseApp } = require('./firebaseAdmin');

const BUCKET_NAME = process.env.STORAGE_BUCKET || 'theknittedcloudcompany-f2afd-product-images';

function getBucket() {
    return getStorage(getFirebaseApp()).bucket(BUCKET_NAME);
}

async function uploadImage(buffer, mimeType, filename) {
    const bucket = getBucket();
    const file = bucket.file(`products/${Date.now()}-${filename}`);
    await file.save(buffer, { metadata: { contentType: mimeType } });
    return `https://storage.googleapis.com/${BUCKET_NAME}/${file.name}`;
}

module.exports = { uploadImage };
