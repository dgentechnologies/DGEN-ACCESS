const express = require('express');
const router = express.Router();
const { db, realtimeDb } = require('../config/firebase');

/**
 * GET /api/logs
 * Get access logs
 */
router.get('/', async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({
        success: false,
        message: 'Firebase not configured'
      });
    }

    const limit = parseInt(req.query.limit) || 100;
    const snapshot = await db.collection('logs')
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();

    const logs = [];
    snapshot.forEach(doc => {
      logs.push({
        id: doc.id,
        ...doc.data()
      });
    });

    res.json({
      success: true,
      data: logs
    });
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/logs/realtime
 * Get real-time logs reference info
 */
router.get('/realtime', async (req, res) => {
  try {
    if (!realtimeDb) {
      return res.status(503).json({
        success: false,
        message: 'Firebase Realtime Database not configured'
      });
    }

    res.json({
      success: true,
      message: 'Connect to Firebase Realtime Database directly from frontend',
      path: 'logs'
    });
  } catch (error) {
    console.error('Error in realtime endpoint:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * DELETE /api/logs
 * Clear all logs (admin only - add authentication)
 */
router.delete('/', async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({
        success: false,
        message: 'Firebase not configured'
      });
    }

    // Delete from Firestore
    const snapshot = await db.collection('logs').get();
    const batch = db.batch();
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();

    // Clear Realtime Database
    if (realtimeDb) {
      await realtimeDb.ref('logs').remove();
    }

    res.json({
      success: true,
      message: 'All logs cleared successfully'
    });
  } catch (error) {
    console.error('Error clearing logs:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
