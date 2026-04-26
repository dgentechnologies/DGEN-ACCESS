/**
 * Next.js Instrumentation Hook
 *
 * This file is executed once per server process start, before the app handles
 * any requests.  It automatically migrates all Firestore users to the Firebase
 * Realtime Database (access/rfid_cards) so the ESP32 always has a fresh and
 * complete card list without requiring a manual `npm run migrate-rtdb` step.
 *
 * Docs: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  // Only run on the Node.js runtime — skip the Edge runtime which cannot use
  // firebase-admin and has no access to process environment credentials.
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;

  // Guard: skip if RTDB is not configured (e.g. local dev without full setup)
  if (!process.env.FIREBASE_ACCESS_DATABASE_URL) {
    console.log('⚠️  FIREBASE_ACCESS_DATABASE_URL not set — skipping auto RTDB migration');
    return;
  }

  try {
    // Dynamic import keeps this module out of the edge bundle and avoids
    // circular dependency issues at module-evaluation time.
    const { db } = await import('./lib/firebaseAdmin.js');
    const { syncUserToRtdb } = await import('./lib/realtimeDb.js');

    if (!db) {
      console.warn('⚠️  Firebase Admin not initialised — skipping auto RTDB migration');
      return;
    }

    console.log('🔄  Auto-migrating Firestore users → RTDB access/rfid_cards ...');

    const snapshot = await db.collection('users').get();

    if (snapshot.empty) {
      console.log('ℹ️   No users found in Firestore — nothing to migrate to RTDB');
      return;
    }

    // Run all upserts in parallel for speed
    await Promise.all(
      snapshot.docs.map(doc => syncUserToRtdb(doc.id, doc.data()))
    );

    console.log(`✓  Auto-migration complete: ${snapshot.size} user(s) synced to RTDB`);
  } catch (error) {
    // Log but never crash the server on migration failure
    console.error('❌  Auto RTDB migration failed:', error.message);
  }
}
