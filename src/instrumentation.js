/**
 * Next.js Instrumentation Hook
 *
 * Executed once per server process start, before the app handles any requests.
 *
 * This hook performs two jobs automatically so no manual steps are required:
 *
 *  1. USER MIGRATION (Firestore → RTDB)
 *     Syncs every Firestore user into access/rfid_cards so the ESP32 always
 *     has a complete, up-to-date card list after every deploy / cold start.
 *
 *  2. LOG STREAMING (RTDB → Firestore → UI)
 *     a) On startup: flushes any access log entries the ESP32 wrote to RTDB
 *        while the server was offline (back-fill).
 *     b) Persistent listener: attaches an RTDB `child_added` listener on
 *        access/access_logs so that every new log the ESP32 pushes is
 *        immediately written into the Firestore `logs` collection.  The
 *        frontend Logs page uses a Firestore onSnapshot listener, so the
 *        new entry appears in the browser automatically — no polling, no
 *        manual sync button required.
 *
 * Docs: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  // Only run on the Node.js runtime — skip the Edge runtime which cannot use
  // firebase-admin and has no access to process environment credentials.
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;

  // Guard: skip if RTDB is not configured (e.g. local dev without full setup)
  if (!process.env.FIREBASE_ACCESS_DATABASE_URL) {
    console.log('⚠️  FIREBASE_ACCESS_DATABASE_URL not set — skipping auto RTDB tasks');
    return;
  }

  // Dynamic imports keep this module out of the edge bundle and avoid circular
  // dependency issues at module-evaluation time.
  const { db } = await import('./lib/firebaseAdmin.js');
  const { syncUserToRtdb, syncRtdbLogsToFirestore } = await import('./lib/realtimeDb.js');

  if (!db) {
    console.warn('⚠️  Firebase Admin not initialised — skipping auto RTDB tasks');
    return;
  }

  // ── 1. USER MIGRATION: Firestore → RTDB ────────────────────────────────────
  try {
    console.log('🔄  Auto-migrating Firestore users → RTDB access/rfid_cards ...');
    const snapshot = await db.collection('users').get();

    if (snapshot.empty) {
      console.log('ℹ️   No users found in Firestore — nothing to migrate to RTDB');
    } else {
      await Promise.all(snapshot.docs.map(doc => syncUserToRtdb(doc.id, doc.data())));
      console.log(`✓  User migration complete: ${snapshot.size} user(s) synced to RTDB`);
    }
  } catch (error) {
    // Never crash the server on migration failure
    console.error('❌  Auto RTDB user migration failed:', error.message);
  }

  // ── 2a. LOG BACK-FILL: flush existing unsynced RTDB logs → Firestore ────────
  try {
    const backFilled = await syncRtdbLogsToFirestore(db);
    if (backFilled > 0) {
      console.log(`✓  Back-filled ${backFilled} RTDB access log(s) into Firestore on startup`);
    }
  } catch (error) {
    console.error('❌  RTDB log back-fill failed:', error.message);
  }

  // ── 2b. LOG STREAMING: persistent RTDB listener → Firestore → UI ────────────
  // We listen for child_added on access/access_logs.  Every new push entry the
  // ESP32 creates is immediately written into Firestore, which triggers the
  // frontend Firestore onSnapshot listener so the dashboard updates in real time.
  try {
    const admin = await import('firebase-admin');
    const rtdb = admin.default.database();

    rtdb.ref('access/access_logs').on('child_added', async (snapshot) => {
      const log = snapshot.val();
      const pushKey = snapshot.key;

      // Skip entries that were already synced during the back-fill pass above
      if (log.synced === true) return;

      // Skip malformed entries that lack a numeric timestamp
      if (typeof log.timestamp !== 'number') return;

      try {
        // Write to Firestore using the RTDB push key as the document ID so
        // re-runs (e.g. after server restart) are fully idempotent.
        await db.collection('logs').doc(pushKey).set({
          cardId:    log.cardId   || 'Unknown',
          userId:    log.userId   || log.cardId || 'Unknown',
          name:      log.name     || 'Unknown',
          status:    log.status   || 'Unknown',
          deviceId:  log.deviceId || '',
          method:    log.method   || 'RFID',
          cardUid:   log.cardUid  || '',
          timestamp: log.timestamp,
          // ISO string for convenient dashboard display
          time:      new Date(log.timestamp * 1000).toISOString(),
          // Legacy alias kept for any existing dashboard queries
          id:        log.userId || log.cardId || 'Unknown'
        }, { merge: true });

        // Mark the RTDB entry as synced so future server restarts skip it
        await rtdb.ref(`access/access_logs/${pushKey}/synced`).set(true);
      } catch (writeError) {
        console.error(`❌  Failed to sync RTDB log ${pushKey} to Firestore:`, writeError.message);
      }
    }, (listenerError) => {
      console.error('❌  RTDB access_logs listener error:', listenerError.message);
    });

    console.log('✓  RTDB access_logs listener active — new logs will stream to Firestore automatically');
  } catch (error) {
    console.error('❌  Failed to start RTDB access_logs listener:', error.message);
  }
}
