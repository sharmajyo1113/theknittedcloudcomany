'use strict';

const { getFirestore } = require('firebase-admin/firestore');
const { getFirebaseApp } = require('./firebaseAdmin');

let db = null;

function getDb() {
    if (!db) db = getFirestore(getFirebaseApp());
    return db;
}

module.exports = { getDb };
