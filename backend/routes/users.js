const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');

/**
 * GET /api/users
 * Get all users
 */
router.get('/', async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({
        success: false,
        message: 'Firebase not configured'
      });
    }

    const snapshot = await db.collection('users').orderBy('createdAt', 'desc').get();
    const users = [];
    
    snapshot.forEach(doc => {
      users.push({
        id: doc.id,
        ...doc.data()
      });
    });

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/users
 * Add a new user
 */
router.post('/', async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({
        success: false,
        message: 'Firebase not configured'
      });
    }

    const { id, name, role } = req.body;

    // Validation
    if (!id || !name || !role) {
      return res.status(400).json({
        success: false,
        message: 'All fields (id, name, role) are required'
      });
    }

    // Check if user ID already exists
    const existingUser = await db.collection('users').doc(id).get();
    if (existingUser.exists) {
      return res.status(400).json({
        success: false,
        message: 'User ID already exists'
      });
    }

    // Create new user
    const newUser = {
      name: name.trim(),
      role: role.trim(),
      status: 'Active',
      isSuperAdmin: false,
      createdAt: new Date().toISOString()
    };

    await db.collection('users').doc(id).set(newUser);

    res.json({
      success: true,
      message: 'User added successfully',
      data: {
        id,
        ...newUser
      }
    });
  } catch (error) {
    console.error('Error adding user:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * PUT /api/users/:id/status
 * Toggle user status (Active/Banned)
 */
router.put('/:id/status', async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({
        success: false,
        message: 'Firebase not configured'
      });
    }

    const userId = req.params.id;
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const userData = userDoc.data();
    const newStatus = userData.status === 'Active' ? 'Banned' : 'Active';

    await userRef.update({
      status: newStatus,
      updatedAt: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Status updated successfully',
      data: {
        id: userId,
        status: newStatus
      }
    });
  } catch (error) {
    console.error('Error toggling status:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * DELETE /api/users/:id
 * Delete a user (cannot delete super admins)
 */
router.delete('/:id', async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({
        success: false,
        message: 'Firebase not configured'
      });
    }

    const userId = req.params.id;
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const userData = userDoc.data();
    if (userData.isSuperAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete super admin users'
      });
    }

    await userRef.delete();

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * PUT /api/users/:id
 * Update user details
 */
router.put('/:id', async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({
        success: false,
        message: 'Firebase not configured'
      });
    }

    const userId = req.params.id;
    const { name, role } = req.body;

    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const updates = {
      updatedAt: new Date().toISOString()
    };

    if (name) updates.name = name.trim();
    if (role) updates.role = role.trim();

    await userRef.update(updates);

    res.json({
      success: true,
      message: 'User updated successfully',
      data: {
        id: userId,
        ...updates
      }
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
