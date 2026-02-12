const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

/**
 * GET /api/payments/chat/access
 * Check user's chat access and free message status
 */
router.get('/chat/access', auth, async (req, res) => {
  try {
    const user = req.user;
    const accessStatus = user.hasChatAccess();
    
    console.log(`Chat access check for user ${user._id}:`, {
      hasAccess: accessStatus.hasAccess,
      planType: accessStatus.planType,
      freeMessagesRemaining: accessStatus.freeMessagesRemaining
    });

    res.json({
      success: true,
      data: accessStatus
    });
  } catch (error) {
    console.error('Error checking chat access:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to check chat access'
    });
  }
});

/**
 * POST /api/payments/chat/initialize
 * Initialize a payment for chat access
 */
router.post('/chat/initialize', auth, async (req, res) => {
  try {
    const { amount, planType, callbackUrl } = req.body;
    
    if (!amount || !planType) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Amount and planType are required'
      });
    }

    // Validate plan type
    const validPlans = ['daily', 'monthly'];
    if (!validPlans.includes(planType)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid plan type'
      });
    }

    // Generate payment reference (in production, integrate with payment provider)
    const reference = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Mock payment URL (replace with actual payment provider URL)
    const paymentUrl = `https://payment-provider.com/pay/${reference}`;
    
    // Calculate expiry date based on plan
    const now = new Date();
    let expiryDate;
    
    if (planType === 'daily') {
      expiryDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours
    } else if (planType === 'monthly') {
      expiryDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
    }

    res.json({
      success: true,
      data: {
        payment_url: paymentUrl,
        reference,
        amount,
        planType,
        expiryDate: expiryDate.toISOString()
      }
    });
  } catch (error) {
    console.error('Error initializing payment:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to initialize payment'
    });
  }
});

/**
 * POST /api/payments/chat/verify
 * Verify a payment and update user's subscription
 */
router.post('/chat/verify', async (req, res) => {
  try {
    const { reference } = req.body;
    
    if (!reference) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Payment reference is required'
      });
    }

    // In production, verify with payment provider
    // For now, we'll mock a successful verification
    const mockPaymentData = {
      reference,
      paid: true,
      planType: 'daily', // Extract from payment provider response
      amount: 300,
      expiryDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };

    // If payment is verified, update user's subscription
    if (mockPaymentData.paid) {
      // Find user by reference or update based on authenticated user
      const token = req.header('Authorization')?.replace('Bearer ', '');
      if (token) {
        try {
          const jwt = require('jsonwebtoken');
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          const user = await User.findById(decoded.userId);
          
          if (user) {
            user.subscription = {
              planType: mockPaymentData.planType,
              status: 'active',
              startDate: new Date(),
              endDate: new Date(mockPaymentData.expiryDate),
              paymentReference: reference
            };
            await user.save();
            console.log(`Updated subscription for user ${user._id}`);
          }
        } catch (jwtError) {
          console.error('JWT verification error during payment verification:', jwtError);
        }
      }
    }

    res.json({
      success: true,
      data: mockPaymentData
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to verify payment'
    });
  }
});

/**
 * GET /api/payments/subscription/plans
 * Get available subscription plans
 */
router.get('/subscription/plans', async (req, res) => {
  try {
    const plans = [
      {
        id: 'daily',
        name: 'Daily Access',
        description: 'Access to all chat features for 24 hours',
        price: 300,
        currency: 'NGN',
        interval: 'day',
        features: [
          'Unlimited messages',
          'Access to all matches',
          '24/7 support'
        ]
      },
      {
        id: 'monthly',
        name: 'Monthly Access',
        description: 'Full access for 30 days',
        price: 3000,
        currency: 'NGN',
        interval: 'month',
        isPopular: true,
        features: [
          'All Daily Access features',
          'Priority support',
          'Profile boost',
          'See who liked you'
        ]
      }
    ];

    res.json({
      success: true,
      data: plans
    });
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch subscription plans'
    });
  }
});

module.exports = router;
