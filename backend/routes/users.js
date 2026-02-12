const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

/**
 * GET /api/users/profile
 * Get user profile
 */
router.get('/profile', auth, async (req, res) => {
  try {
    const user = req.user;
    
    res.json({
      success: true,
      data: {
        id: user._id,
        email: user.email,
        profile: user.profile,
        subscription: user.subscription,
        freeMessages: user.freeMessages
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get profile'
    });
  }
});

/**
 * PUT /api/users/profile
 * Update user profile
 */
router.put('/profile', auth, async (req, res) => {
  try {
    const { profile } = req.body;
    const user = req.user;
    
    if (profile) {
      user.profile = { ...user.profile, ...profile };
    }
    
    await user.save();
    
    res.json({
      success: true,
      data: {
        id: user._id,
        email: user.email,
        profile: user.profile,
        subscription: user.subscription
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update profile'
    });
  }
});

/**
 * POST /api/users/reset-free-messages/:userId
 * Reset free messages for a user (for testing)
 */
router.post('/reset-free-messages/:userId', auth, async (req, res) => {
  try {
    // Only allow if requesting user is an admin or the same user
    const userId = req.params.userId;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    // Reset free messages
    user.freeMessages.count = 0;
    user.freeMessages.lastReset = new Date();
    await user.save();

    res.json({
      success: true,
      message: `Free messages reset for user ${userId}`,
      data: {
        userId: user._id,
        freeMessages: user.freeMessages
      }
    });
  } catch (error) {
    console.error('Reset free messages error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to reset free messages'
    });
  }
});

module.exports = router;
