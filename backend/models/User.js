const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please enter a valid email address'
    ]
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't include password in queries by default
  },
  avatar: {
    type: String,
    default: null
  },
  preferences: {
    emailNotifications: {
      type: Boolean,
      default: true
    },
    dailyReminders: {
      type: Boolean,
      default: true
    },
    communityUpdates: {
      type: Boolean,
      default: false
    },
    darkMode: {
      type: Boolean,
      default: true
    }
  },
  stats: {
    journalEntriesCount: {
      type: Number,
      default: 0
    },
    daysActive: {
      type: Number,
      default: 0
    },
    insightsGained: {
      type: Number,
      default: 0
    },
    streak: {
      type: Number,
      default: 0
    },
    lastActiveDate: {
      type: Date,
      default: Date.now
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: String,
  passwordResetToken: String,
  passwordResetExpires: Date,
  lastLogin: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for better query performance
userSchema.index({ email: 1 });
userSchema.index({ createdAt: -1 });

// Virtual for journal entries
userSchema.virtual('journalEntries', {
  ref: 'JournalEntry',
  localField: '_id',
  foreignField: 'user'
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only hash password if it's been modified
  if (!this.isModified('password')) return next();
  
  try {
    // Hash password with cost of 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Pre-save middleware to update timestamp
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Instance method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Instance method to generate auth token
userSchema.methods.generateAuthToken = function() {
  const payload = {
    id: this._id,
    email: this.email,
    name: this.name
  };
  
  return jwt.sign(payload, process.env.JWT_SECRET || 'fallback_secret', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

// Instance method to update stats
userSchema.methods.updateStats = async function(updates) {
  Object.assign(this.stats, updates);
  
  // Update days active if it's a new day
  const today = new Date();
  const lastActive = new Date(this.stats.lastActiveDate);
  
  if (today.toDateString() !== lastActive.toDateString()) {
    this.stats.daysActive += 1;
    this.stats.lastActiveDate = today;
  }
  
  await this.save();
};

// Instance method to recalculate stats from database
userSchema.methods.recalculateStats = async function() {
  const JournalEntry = mongoose.model('JournalEntry');
  
  // Count actual journal entries (not deleted)
  const journalEntriesCount = await JournalEntry.countDocuments({
    user: this._id,
    isDeleted: { $ne: true }
  });
  
  // Update stats with accurate count
  this.stats.journalEntriesCount = journalEntriesCount;
  
  // Update days active if it's a new day
  const today = new Date();
  const lastActive = new Date(this.stats.lastActiveDate);
  
  if (today.toDateString() !== lastActive.toDateString()) {
    this.stats.daysActive += 1;
    this.stats.lastActiveDate = today;
  }
  
  await this.save();
  
  return this.stats;
};

// Static method to find by email
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

// Static method to find active users
userSchema.statics.findActiveUsers = function() {
  return this.find({ isActive: true });
};

module.exports = mongoose.model('User', userSchema);