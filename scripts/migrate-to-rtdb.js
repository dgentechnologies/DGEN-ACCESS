#!/usr/bin/env node

/**
 * migrate-to-rtdb.js
 *
 * One-time migration script: copies every user stored in Firestore
 * (`users` collection, named database "access") into the Realtime Database
 * under `access/rfid_cards/<userId>`, following the canonical schema:
 *
 *   {
 *     userId:     "DGEN-EX-01001",
 *     name:       "Tirthankar Dasgupta",
 *     role:       "CEO & CTO",
 *     department: "Executive",
 *     status:     "Active",
 *     cardText:   "Name: Tirthankar Dasgupta | ID: DGEN-EX-01001 | Role: CEO & CTO",
 *     cardUid:    "A1B2C3D4",
 *     createdAt:  1714000000,   // Unix seconds
 *     updatedAt:  1714000000
 *   }
 *
 * Usage:
 *   1. Copy .env.example → .env.local and fill in real credentials.
 *   2. node scripts/migrate-to-rtdb.js
 *
 * The script is idempotent — running it multiple times only overwrites
 * existing RTDB entries with the latest Firestore data.
 */

'use strict';

const path = require('path');
const fs   = require('fs');

// ─── Load environment variables from .env.local ───────────────────────────────
const envPath = path.join(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('\n❌  .env.local not found.');
  console.error('    Copy .env.example → .env.local and fill in your credentials.\n');
  process.exit(1);
}
require('dotenv').config({ path: envPath });

// ─── Validate required env vars ───────────────────────────────────────────────
const required = [
  'FIREBASE_ACCESS_PROJECT_ID',
  'FIREBASE_ACCESS_CLIENT_EMAIL',
  'FIREBASE_ACCESS_PRIVATE_KEY',
  'FIREBASE_ACCESS_DATABASE_URL',
  'FIREBASE_ACCESS_DATABASE_ID'
];

const missing = required.filter(k => !process.env[k]);
if (missing.length) {
  console.error('\n❌  Missing required environment variables:');
  missing.forEach(k => console.error(`    • ${k}`));
  console.error('\n    Please set them in .env.local and try again.\n');
  process.exit(1);
}

// ─── Initialize Firebase Admin ────────────────────────────────────────────────
const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

const serviceAccount = {
  projectId:   process.env.FIREBASE_ACCESS_PROJECT_ID,
  clientEmail: process.env.FIREBASE_ACCESS_CLIENT_EMAIL,
  privateKey:  process.env.FIREBASE_ACCESS_PRIVATE_KEY.replace(/\\n/g, '\n')
};

const app = admin.initializeApp({
  credential:  admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_ACCESS_DATABASE_URL
});

// Named Firestore database ("access")
const firestoreDb = getFirestore(app, process.env.FIREBASE_ACCESS_DATABASE_ID);
const rtdb        = admin.database();

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Build the NDEF-style card text that is physically encoded on each card. */
function buildCardText(userId, data) {
  return `Name: ${data.name || ''} | ID: ${userId} | Role: ${data.role || ''}`;
}

/** Convert a Firestore timestamp / ISO string / number to Unix seconds. */
function toUnixSeconds(value) {
  if (!value) return Math.floor(Date.now() / 1000);
  if (typeof value === 'number') {
    // Unix timestamps in seconds fit in ~32 bits (≤ ~2.1 billion).
    // Values above 1e10 (10 billion) must be milliseconds — convert them.
    const MILLISECONDS_THRESHOLD = 1e10;
    return value > MILLISECONDS_THRESHOLD ? Math.floor(value / 1000) : value;
  }
  if (typeof value === 'string') {
    const ms = Date.parse(value);
    return isNaN(ms) ? Math.floor(Date.now() / 1000) : Math.floor(ms / 1000);
  }
  // Firestore Timestamp object
  if (typeof value.toMillis === 'function') {
    return Math.floor(value.toMillis() / 1000);
  }
  return Math.floor(Date.now() / 1000);
}

// ─── Main migration ───────────────────────────────────────────────────────────

async function migrate() {
  console.log('\n🚀  DGEN Access Control — Firestore → RTDB Migration\n');
  console.log('='.repeat(60));
  console.log(`Project  : ${process.env.FIREBASE_ACCESS_PROJECT_ID}`);
  console.log(`Firestore: database "${process.env.FIREBASE_ACCESS_DATABASE_ID}"`);
  console.log(`RTDB     : ${process.env.FIREBASE_ACCESS_DATABASE_URL}`);
  console.log('='.repeat(60) + '\n');

  // Fetch all users from the named Firestore database
  let snapshot;
  try {
    snapshot = await firestoreDb.collection('users').get();
  } catch (err) {
    console.error('❌  Failed to read Firestore users collection:', err.message);
    process.exit(1);
  }

  if (snapshot.empty) {
    console.log('ℹ️   No users found in Firestore. Nothing to migrate.\n');
    process.exit(0);
  }

  console.log(`Found ${snapshot.size} user(s) in Firestore.\n`);

  let succeeded = 0;
  let failed    = 0;

  for (const doc of snapshot.docs) {
    const userId = doc.id;
    const data   = doc.data();

    const nowSeconds = Math.floor(Date.now() / 1000);
    const rtdbEntry  = {
      userId,
      name:       data.name       || '',
      role:       data.role       || '',
      department: data.department || '',
      status:     data.status     || 'Active',
      cardText:   buildCardText(userId, data),
      // cardUid: prefer explicit cardUid field, then rfidCardId, then empty
      cardUid:    data.cardUid || data.rfidCardId || '',
      createdAt:  toUnixSeconds(data.createdAt) || nowSeconds,
      updatedAt:  toUnixSeconds(data.updatedAt) || nowSeconds
    };

    try {
      await rtdb.ref(`access/rfid_cards/${userId}`).set(rtdbEntry);
      console.log(`  ✓  ${userId.padEnd(20)} — ${data.name || '(no name)'}`);
      succeeded++;
    } catch (err) {
      console.error(`  ❌  ${userId} — Error: ${err.message}`);
      failed++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`\n✅  Migration complete.`);
  console.log(`    Succeeded : ${succeeded}`);
  if (failed > 0) {
    console.log(`    Failed    : ${failed}  ← check errors above`);
  }
  console.log(`\n    RTDB path : access/rfid_cards/\n`);

  await app.delete();
  process.exit(failed > 0 ? 1 : 0);
}

migrate().catch(err => {
  console.error('\n❌  Unexpected error:', err.message);
  process.exit(1);
});
