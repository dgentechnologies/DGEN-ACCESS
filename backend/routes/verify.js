const express = require('express');
const router = express.Router();
const { db, realtimeDb } = require('../config/firebase');

/**
 * ESP32 Verification Endpoint
 * POST /verify
 * 
 * Maintains backward compatibility with existing ESP32 code
 * Accepts both form data and JSON
 * Returns "YES" or "NO" as plain text
 */
router.post('/', async (req, res) => {
  try {
    // Support both form data (ESP32 primary) and JSON (fallback)
    let data = req.body.data || req.query.data || '';
    data = data.trim();

    console.log('ESP32 Verification request:', data);

    if (!data) {
      console.log('Empty data received');
      return res.status(200).send('NO');
    }

    // Search for user in Firebase
    const user = await findUserByData(data);

    if (user && user.status === 'Active') {
      // User exists and is active - grant access
      await logAccess(user, 'Granted');
      console.log(`✓ Access granted: ${user.name} (${user.id})`);
      return res.status(200).send('YES');
    } else if (user) {
      // User exists but is banned
      await logAccess(user, 'Denied');
      console.log(`✗ Access denied: ${user.name} (${user.id}) - Banned`);
      return res.status(200).send('NO');
    } else {
      // Unknown user
      await logAccess({ name: 'Unknown', id: data }, 'Denied');
      console.log(`✗ Access denied: Unknown user - ${data}`);
      return res.status(200).send('NO');
    }
  } catch (error) {
    console.error('Error in verify endpoint:', error);
    return res.status(200).send('NO');
  }
});

/**
 * Find user by ID or Name
 * Handles formatted strings like "Name: X | ID: Y | Role: Z"
 */
async function findUserByData(data) {
  if (!db) return null;

  try {
    let userId = null;
    let userName = null;

    // Parse formatted data if it contains pipe separators
    if (data.includes('|')) {
      const parts = data.split('|');
      for (const part of parts) {
        const trimmed = part.trim();
        if (trimmed.includes(':')) {
          const [key, value] = trimmed.split(':').map(s => s.trim());
          if (key.toLowerCase() === 'id') {
            userId = value;
          } else if (key.toLowerCase() === 'name') {
            userName = value;
          }
        }
      }
    } else {
      // Plain data - could be ID or name
      userId = data;
      userName = data;
    }

    // First try exact ID match (fastest)
    if (userId) {
      const userDoc = await db.collection('users').doc(userId).get();
      if (userDoc.exists) {
        return { id: userDoc.id, ...userDoc.data() };
      }
    }

    // Fall back to name search (slower)
    if (userName) {
      const snapshot = await db.collection('users')
        .where('name', '==', userName)
        .limit(1)
        .get();
      
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        return { id: doc.id, ...doc.data() };
      }
    }

    return null;
  } catch (error) {
    console.error('Error finding user:', error);
    return null;
  }
}

/**
 * Log access attempt to both Firestore and Realtime Database
 */
async function logAccess(user, status) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    time: timestamp,
    name: user.name || 'Unknown',
    id: user.id || 'Unknown',
    status: status,
    timestamp: Date.now()
  };

  try {
    // Store in Firestore for queries and persistence
    if (db) {
      await db.collection('logs').add(logEntry);
    }

    // Store in Realtime Database for real-time updates
    if (realtimeDb) {
      const logsRef = realtimeDb.ref('logs');
      await logsRef.push(logEntry);
      
      // Keep only last 100 logs
      const snapshot = await logsRef.orderByChild('timestamp').once('value');
      const logs = [];
      snapshot.forEach(child => {
        logs.push({ key: child.key, timestamp: child.val().timestamp });
      });
      
      if (logs.length > 100) {
        logs.sort((a, b) => a.timestamp - b.timestamp);
        const toDelete = logs.slice(0, logs.length - 100);
        for (const log of toDelete) {
          await realtimeDb.ref(`logs/${log.key}`).remove();
        }
      }
    }
  } catch (error) {
    console.error('Error logging access:', error);
  }
}

module.exports = router;
