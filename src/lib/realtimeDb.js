import admin from 'firebase-admin';

/**
 * Returns the Firebase Realtime Database instance, or null if
 * FIREBASE_ACCESS_DATABASE_URL is not configured.
 */
function getRtdb() {
  if (!process.env.FIREBASE_ACCESS_DATABASE_URL) return null;
  try {
    return admin.database();
  } catch (error) {
    console.error('Error getting Realtime Database instance:', error.message);
    return null;
  }
}

/**
 * Converts a Firestore Timestamp, ISO date string, Unix-millisecond number,
 * or Unix-second number to Unix seconds.  Returns `fallback` (defaults to
 * the current time in seconds) when the value is absent or unparseable.
 */
function toUnixSeconds(value, fallback) {
  const now = fallback ?? Math.floor(Date.now() / 1000);
  if (!value) return now;
  if (typeof value === 'number') {
    // Values above 1e10 (10 billion) are milliseconds — convert them
    return value > 1e10 ? Math.floor(value / 1000) : value;
  }
  if (typeof value === 'string') {
    const ms = Date.parse(value);
    return isNaN(ms) ? now : Math.floor(ms / 1000);
  }
  // Firestore Timestamp object (Admin SDK)
  if (typeof value.toMillis === 'function') return Math.floor(value.toMillis() / 1000);
  if (typeof value.seconds === 'number')    return value.seconds;
  return now;
}

/**
 * Builds the formatted card text string that is physically stored on the
 * RFID card.  The ESP32 reads this text from the card and compares it
 * against the `cardText` field stored in the Realtime Database.
 *
 * Format: "Name: <name> | ID: <userId> | Role: <role>"
 *
 * @param {string} userId
 * @param {object} userData
 * @returns {string}
 */
export function buildCardText(userId, userData) {
  return `Name: ${userData.name || ''} | ID: ${userId} | Role: ${userData.role || ''}`;
}

/**
 * Syncs a single user to the Realtime Database `access/rfid_cards` node so
 * that the ESP32 can verify cards directly against RTDB.
 *
 * RTDB schema per card:
 *   userId, name, role, department, status, cardText, cardUid,
 *   createdAt (Unix seconds), updatedAt (Unix seconds)
 *
 * @param {string} userId   - Firestore document ID (e.g. "DGEN-EX-01001")
 * @param {object} userData - User data object from Firestore
 * @throws {Error} if the Realtime Database is not configured or the write fails
 */
export async function syncUserToRtdb(userId, userData) {
  const rtdb = getRtdb();
  if (!rtdb) {
    throw new Error(
      'Realtime Database not available — check FIREBASE_ACCESS_DATABASE_URL'
    );
  }

  const nowSeconds = Math.floor(Date.now() / 1000);

  const cardData = {
    userId,
    name:       userData.name       || '',
    role:       userData.role       || '',
    department: userData.department || '',
    status:     userData.status     || 'Active',
    cardText:   buildCardText(userId, userData),
    cardUid:    userData.cardUid    || userData.rfidCardId || '',
    createdAt:  toUnixSeconds(userData.createdAt, nowSeconds),
    updatedAt:  toUnixSeconds(userData.updatedAt, nowSeconds)
  };

  // Let write errors propagate so callers can log / surface them properly
  await rtdb.ref(`access/rfid_cards/${userId}`).set(cardData);
}

/**
 * Removes a user's RFID card entry from the Realtime Database when the user
 * is deleted in Firestore.
 *
 * @param {string} userId - Firestore document ID
 */
export async function removeUserFromRtdb(userId) {
  const rtdb = getRtdb();
  if (!rtdb) return;

  try {
    await rtdb.ref(`access/rfid_cards/${userId}`).remove();
  } catch (error) {
    console.error('Error removing user from Realtime Database:', error.message);
  }
}

/**
 * Updates only the `status` field of a card entry in the Realtime Database
 * when a user is banned or unbanned via the admin dashboard.
 *
 * @param {string} userId    - Firestore document ID
 * @param {string} newStatus - "Active" or "Banned"
 */
export async function updateRtdbCardStatus(userId, newStatus) {
  const rtdb = getRtdb();
  if (!rtdb) return;

  try {
    await rtdb.ref(`access/rfid_cards/${userId}/status`).set(newStatus);
    await rtdb.ref(`access/rfid_cards/${userId}/updatedAt`).set(Math.floor(Date.now() / 1000));
  } catch (error) {
    console.error('Error updating card status in Realtime Database:', error.message);
  }
}

/**
 * Sets the remote unlock flag in RTDB so the ESP32 picks it up on its next
 * polling cycle and triggers the door relay.
 *
 * @param {string} triggeredBy - Employee ID or label (e.g. "DASHBOARD")
 */
export async function setRtdbRemoteUnlock(triggeredBy) {
  const rtdb = getRtdb();
  if (!rtdb) return;

  try {
    await rtdb.ref('access/remote_unlock').set({
      requested:   true,
      triggeredBy: triggeredBy || 'DASHBOARD',
      requestedAt: Math.floor(Date.now() / 1000)
    });
  } catch (error) {
    console.error('Error setting remote unlock in Realtime Database:', error.message);
  }
}

/**
 * Reads all unsynced access log entries from RTDB, writes them as documents
 * into the Firestore `logs` collection (using the RTDB push key as the
 * Firestore document ID to prevent duplicates), then marks them as synced
 * in RTDB.
 *
 * This is called from `/api/esp/log` or `/api/sync-rtdb` to keep the
 * Firestore-backed dashboard up-to-date.
 *
 * @param {FirebaseFirestore.Firestore} firestoreDb - Admin Firestore instance
 * @returns {number} Number of log entries synced
 */
export async function syncRtdbLogsToFirestore(firestoreDb) {
  const rtdb = getRtdb();
  if (!rtdb) {
    console.warn('⚠️  RTDB not available — log sync skipped');
    return 0;
  }
  if (!firestoreDb) return 0;

  try {
    // Fetch all access logs; filter out already-synced ones in JS since RTDB
    // cannot query for "field missing" (ESP32 doesn't set a synced flag)
    const snapshot = await rtdb.ref('access/access_logs').once('value');

    if (!snapshot.exists()) return 0;

    // Keys to mark as synced in RTDB after the Firestore batch commits
    // Format: { "<pushKey>/synced": true } — relative to access/access_logs
    const rtdbUpdates = {};
    const batch = firestoreDb.batch();
    let count = 0;

    snapshot.forEach(child => {
      const log = child.val();

      // Skip entries already synced by a previous run
      if (log.synced === true) return;

      // Accept timestamp as a number (ESP32 native) or a numeric string
      let timestamp = log.timestamp;
      if (typeof timestamp === 'string') timestamp = parseInt(timestamp, 10);
      if (typeof timestamp !== 'number' || !isFinite(timestamp)) return;

      // Use the RTDB push key as the Firestore document ID to ensure
      // idempotency — re-running the sync never creates duplicate docs.
      const logRef = firestoreDb.collection('logs').doc(child.key);
      batch.set(logRef, {
        cardId:    log.cardId   || 'Unknown',
        userId:    log.userId   || log.cardId || 'Unknown',
        name:      log.name     || 'Unknown',
        status:    log.status   || 'Unknown',
        deviceId:  log.deviceId || '',
        method:    log.method   || 'RFID',
        cardUid:   log.cardUid  || '',
        timestamp,
        // ISO string for dashboard display (timestamp is Unix seconds from ESP32)
        time:      new Date(timestamp * 1000).toISOString(),
        // Keep legacy `id` alias so existing dashboard queries still work
        id: log.userId || log.cardId || 'Unknown'
      }, { merge: true });

      // Relative to access/access_logs — cleaner than root-level multi-path update
      rtdbUpdates[`${child.key}/synced`] = true;
      count++;
    });

    if (count > 0) {
      // Write to Firestore first; only mark as synced in RTDB on success
      await batch.commit();
      await rtdb.ref('access/access_logs').update(rtdbUpdates);
    }

    return count;
  } catch (error) {
    console.error('Error syncing Realtime Database logs to Firestore:', error.message);
    return 0;
  }
}
