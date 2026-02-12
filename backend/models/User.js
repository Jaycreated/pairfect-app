const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  profile: {
    name: String,
    age: Number,
    gender: String,
    bio: String,
    photos: [String]
  },
  subscription: {
    planType: {
      type: String,
      enum: ['free', 'daily', 'monthly'],
      default: 'free'
    },
    status: {
      type: String,
      enum: ['active', 'expired', 'cancelled'],
      default: 'active'
    },
    startDate: Date,
    endDate: Date,
    paymentReference: String
  },
  freeMessages: {
    count: {
      type: Number,
      default: 0
    },
    lastReset: {
      type: Date,
      default: Date.now
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for faster queries
userSchema.index({ email: 1 });
userSchema.index({ 'subscription.status': 1 });
userSchema.index({ 'subscription.endDate': 1 });

// Method to check if user has chat access
userSchema.methods.hasChatAccess = function() {
  const now = new Date();
  
  // Check if user has active paid subscription
  if (this.subscription.planType !== 'free' && 
      this.subscription.status === 'active' && 
      this.subscription.endDate > now) {
    return {
      hasAccess: true,
      planType: this.subscription.planType,
      expiryDate: this.subscription.endDate,
      reference: this.subscription.paymentReference
    };
  }
  
  // Check free messages
  const freeMessagesLimit = parseInt(process.env.FREE_MESSAGES_LIMIT) || 5;
  const resetHours = parseInt(process.env.FREE_MESSAGES_RESET_HOURS) || 24;
  
  // Reset free messages if enough time has passed
  const hoursSinceReset = (now - this.freeMessages.lastReset) / (1000 * 60 * 60);
  if (hoursSinceReset >= resetHours) {
    this.freeMessages.count = 0;
    this.freeMessages.lastReset = now;
  }
  
  const hasFreeAccess = this.freeMessages.count < freeMessagesLimit;
  
  return {
    hasAccess: hasFreeAccess,
    planType: 'free',
    freeMessagesRemaining: Math.max(0, freeMessagesLimit - this.freeMessages.count),
    freeMessagesLimit,
    nextResetInHours: Math.max(0, resetHours - hoursSinceReset).toFixed(1)
  };
};

// Method to increment free message count
userSchema.methods.incrementFreeMessages = async function() {
  const freeMessagesLimit = parseInt(process.env.FREE_MESSAGES_LIMIT) || 5;
  const resetHours = parseInt(process.env.FREE_MESSAGES_RESET_HOURS) || 24;
  
  const now = new Date();
  const hoursSinceReset = (now - this.freeMessages.lastReset) / (1000 * 60 * 60);
  
  // Reset if needed
  if (hoursSinceReset >= resetHours) {
    this.freeMessages.count = 1;
    this.freeMessages.lastReset = now;
  } else {
    this.freeMessages.count += 1;
  }
  
  await this.save();
  return this.freeMessages.count < freeMessagesLimit;
};

module.exports = mongoose.model('User', userSchema);
