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
 */
export async function syncUserToRtdb(userId, userData) {
  const rtdb = getRtdb();
  if (!rtdb) return;

  const nowSeconds = Math.floor(Date.now() / 1000);

  // Convert Firestore ISO timestamps to Unix seconds if present
  const createdAt = userData.createdAt
    ? (typeof userData.createdAt === 'number'
        ? userData.createdAt
        : Math.floor(new Date(userData.createdAt).getTime() / 1000))
    : nowSeconds;

  const updatedAt = userData.updatedAt
    ? (typeof userData.updatedAt === 'number'
        ? userData.updatedAt
        : Math.floor(new Date(userData.updatedAt).getTime() / 1000))
    : nowSeconds;

  const cardData = {
    userId,
    name:       userData.name       || '',
    role:       userData.role       || '',
    department: userData.department || '',
    status:     userData.status     || 'Active',
    cardText:   buildCardText(userId, userData),
    cardUid:    userData.cardUid    || userData.rfidCardId || '',
    createdAt,
    updatedAt
  };

  try {
    await rtdb.ref(`access/rfid_cards/${userId}`).set(cardData);
  } catch (error) {
    console.error('Error syncing user to Realtime Database:', error.message);
  }
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
  if (!rtdb || !firestoreDb) return 0;

  try {
    // Fetch all access logs; filter out already-synced ones in JS since RTDB
    // cannot query for "field missing" (ESP32 doesn't set a synced flag)
    const snapshot = await rtdb.ref('access/access_logs').once('value');

    if (!snapshot.exists()) return 0;

    const rtdbUpdates = {};
    const batch = firestoreDb.batch();
    let count = 0;

    snapshot.forEach(child => {
      const log = child.val();

      // Skip entries already synced by a previous run
      if (log.synced === true) return;

      // Skip entries without a valid timestamp to avoid misleading records
      if (typeof log.timestamp !== 'number') return;

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
        timestamp: log.timestamp,
        // ISO string for dashboard display (timestamp is Unix seconds from ESP32)
        time:      new Date(log.timestamp * 1000).toISOString(),
        // Keep legacy `id` alias so existing dashboard queries still work
        id: log.userId || log.cardId || 'Unknown'
      }, { merge: true });

      rtdbUpdates[`access/access_logs/${child.key}/synced`] = true;
      count++;
    });

    if (count > 0) {
      await batch.commit();
      await rtdb.ref('/').update(rtdbUpdates);
    }

    return count;
  } catch (error) {
    console.error('Error syncing Realtime Database logs to Firestore:', error.message);
    return 0;
  }
}
