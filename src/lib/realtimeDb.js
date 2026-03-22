import admin from 'firebase-admin';

/**
 * Returns the Firebase Realtime Database instance, or null if
 * FIREBASE_DATABASE_URL is not configured.
 */
function getRtdb() {
  if (!process.env.FIREBASE_DATABASE_URL) return null;
  try {
    return admin.database();
  } catch (error) {
    console.error('Error getting Realtime Database instance:', error.message);
    return null;
  }
}

/**
 * Syncs a single user to the Realtime Database `rfid_cards` node so that
 * the ESP32 can verify cards without going through Vercel.
 *
 * The key used in rfid_cards is the user's rfidCardId if set, otherwise
 * the userId (backward-compatible with cards that store the employee ID).
 *
 * @param {string} userId  - Firestore document ID (e.g. "DGEN-EX-01001")
 * @param {object} userData - User data object from Firestore
 */
export async function syncUserToRtdb(userId, userData) {
  const rtdb = getRtdb();
  if (!rtdb) return;

  const cardId = userData.rfidCardId || userId;
  const cardData = {
    userId,
    name: userData.name || '',
    role: userData.role || '',
    department: userData.department || '',
    status: userData.status || 'Active'
  };

  try {
    await rtdb.ref(`rfid_cards/${cardId}`).set(cardData);
  } catch (error) {
    console.error('Error syncing user to Realtime Database:', error.message);
  }
}

/**
 * Removes a user's RFID card entry (and any active session) from the
 * Realtime Database when the user is deleted in Firestore.
 *
 * @param {string} userId     - Firestore document ID
 * @param {string} [rfidCardId] - Optional separate RFID card ID
 */
export async function removeUserFromRtdb(userId, rfidCardId) {
  const rtdb = getRtdb();
  if (!rtdb) return;

  const cardId = rfidCardId || userId;
  try {
    await rtdb.ref(`rfid_cards/${cardId}`).remove();
    await rtdb.ref(`active_sessions/${userId}`).remove();
  } catch (error) {
    console.error('Error removing user from Realtime Database:', error.message);
  }
}

/**
 * Updates only the `status` field of a card entry in the Realtime Database
 * when a user is banned or unbanned via the admin dashboard.
 *
 * @param {string} userId     - Firestore document ID
 * @param {string} [rfidCardId] - Optional separate RFID card ID
 * @param {string} newStatus  - "Active" or "Banned"
 */
export async function updateRtdbCardStatus(userId, rfidCardId, newStatus) {
  const rtdb = getRtdb();
  if (!rtdb) return;

  const cardId = rfidCardId || userId;
  try {
    await rtdb.ref(`rfid_cards/${cardId}/status`).set(newStatus);
  } catch (error) {
    console.error('Error updating card status in Realtime Database:', error.message);
  }
}

/**
 * Reads all unsynced access log entries from RTDB, writes them as documents
 * into the Firestore `logs` collection, then marks them as synced in RTDB.
 *
 * This is called from `/api/esp/log` after the ESP32 has finished an access
 * event so that the frontend (which listens to Firestore) stays up-to-date.
 *
 * @param {FirebaseFirestore.Firestore} firestoreDb - Admin Firestore instance
 * @returns {number} Number of log entries synced
 */
export async function syncRtdbLogsToFirestore(firestoreDb) {
  const rtdb = getRtdb();
  if (!rtdb || !firestoreDb) return 0;

  try {
    const snapshot = await rtdb.ref('access_logs')
      .orderByChild('synced')
      .equalTo(false)
      .once('value');

    if (!snapshot.exists()) return 0;

    const rtdbUpdates = {};
    const batch = firestoreDb.batch();
    let count = 0;

    snapshot.forEach(child => {
      const log = child.val();
      const { synced, ...logData } = log;

      const logRef = firestoreDb.collection('logs').doc();
      batch.set(logRef, {
        time: typeof logData.timestamp === 'number'
          ? new Date(logData.timestamp).toISOString()
          : new Date().toISOString(),
        name: logData.name || 'Unknown',
        id: logData.userId || logData.cardId || 'Unknown',
        status: logData.status || 'Unknown',
        timestamp: typeof logData.timestamp === 'number' ? logData.timestamp : Date.now()
      });

      rtdbUpdates[`access_logs/${child.key}/synced`] = true;
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
