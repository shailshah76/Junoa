const mongoose = require('mongoose');

const journalEntrySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  content: {
    type: String,
    required: [true, 'Journal content is required'],
    minlength: [10, 'Journal entry must be at least 10 characters'],
    maxlength: [5000, 'Journal entry cannot exceed 5000 characters']
  },
  preview: {
    type: String,
    maxlength: [150, 'Preview cannot exceed 150 characters']
  },
  mood: {
    type: String,
    enum: {
      values: ['calm', 'reflective', 'peaceful', 'anxious', 'sad', 'happy', 'excited', 'grateful', 'angry', 'confused', 'hopeful', 'stressed'],
      message: 'Mood must be one of the valid options'
    },
    default: 'reflective'
  },
  emotions: [{
    type: String,
    enum: ['joy', 'sadness', 'anger', 'fear', 'surprise', 'disgust', 'trust', 'anticipation']
  }],
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
    maxlength: 20
  }],
  isPrivate: {
    type: Boolean,
    default: true
  },
  shareWithCommunity: {
    type: Boolean,
    default: false
  },
  aiResponse: {
    content: String,
    sentiment: {
      type: String,
      enum: ['positive', 'negative', 'neutral']
    },
    suggestions: [String],
    generatedAt: {
      type: Date,
      default: Date.now
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1
    }
  },
  metadata: {
    wordCount: {
      type: Number,
      default: 0
    },
    readingTime: {
      type: Number, // in minutes
      default: 0
    },
    location: {
      city: String,
      country: String,
      coordinates: {
        latitude: Number,
        longitude: Number
      }
    },
    weather: {
      condition: String,
      temperature: Number,
      humidity: Number
    },
    deviceInfo: {
      type: String,
      platform: String,
      userAgent: String
    }
  },
  attachments: [{
    type: {
      type: String,
      enum: ['image', 'audio', 'video', 'document'],
      required: true
    },
    url: {
      type: String,
      required: true
    },
    filename: String,
    size: Number,
    mimeType: String
  }],
  reactions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    type: {
      type: String,
      enum: ['like', 'heart', 'support', 'inspire']
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    content: {
      type: String,
      required: true,
      maxlength: 500
    },
    isAI: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  editHistory: [{
    content: String,
    editedAt: {
      type: Date,
      default: Date.now
    },
    reason: String
  }],
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: Date,
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

// Indexes for better query performance
journalEntrySchema.index({ user: 1, createdAt: -1 });
journalEntrySchema.index({ mood: 1 });
journalEntrySchema.index({ tags: 1 });
journalEntrySchema.index({ shareWithCommunity: 1, isPrivate: 1 });
journalEntrySchema.index({ createdAt: -1 });

// Virtual for formatted date
journalEntrySchema.virtual('formattedDate').get(function() {
  return this.createdAt.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
});

// Virtual for reaction counts
journalEntrySchema.virtual('reactionCounts').get(function() {
  const counts = {};
  this.reactions.forEach(reaction => {
    counts[reaction.type] = (counts[reaction.type] || 0) + 1;
  });
  return counts;
});

// Pre-save middleware to generate preview and calculate metadata
journalEntrySchema.pre('save', function(next) {
  // Generate preview if not provided
  if (!this.preview && this.content) {
    this.preview = this.content.length > 147 
      ? this.content.substring(0, 147) + '...'
      : this.content;
  }
  
  // Calculate word count
  if (this.content) {
    this.metadata.wordCount = this.content.trim().split(/\s+/).length;
    
    // Estimate reading time (average 200 words per minute)
    this.metadata.readingTime = Math.ceil(this.metadata.wordCount / 200);
  }
  
  this.updatedAt = Date.now();
  next();
});

// Instance method to add AI response
journalEntrySchema.methods.addAIResponse = async function(responseData) {
  this.aiResponse = {
    content: responseData.content,
    sentiment: responseData.sentiment,
    suggestions: responseData.suggestions || [],
    confidence: responseData.confidence || 0.8,
    generatedAt: new Date()
  };
  
  await this.save();
  return this;
};

// Instance method to add reaction
journalEntrySchema.methods.addReaction = async function(userId, reactionType) {
  // Remove existing reaction from this user
  this.reactions = this.reactions.filter(
    reaction => !reaction.user.equals(userId)
  );
  
  // Add new reaction
  this.reactions.push({
    user: userId,
    type: reactionType
  });
  
  await this.save();
  return this;
};

// Instance method to remove reaction
journalEntrySchema.methods.removeReaction = async function(userId) {
  this.reactions = this.reactions.filter(
    reaction => !reaction.user.equals(userId)
  );
  
  await this.save();
  return this;
};

// Instance method to add comment
journalEntrySchema.methods.addComment = async function(userId, content, isAI = false) {
  this.comments.push({
    user: isAI ? null : userId,
    content: content,
    isAI: isAI
  });
  
  await this.save();
  return this;
};

// Static method to find entries by mood
journalEntrySchema.statics.findByMood = function(mood, userId) {
  return this.find({ 
    user: userId, 
    mood: mood,
    isDeleted: false 
  }).sort({ createdAt: -1 });
};

// Static method to get user's recent entries
journalEntrySchema.statics.getRecentEntries = function(userId, limit = 10) {
  return this.find({ 
    user: userId,
    isDeleted: false 
  })
  .sort({ createdAt: -1 })
  .limit(limit)
  .populate('user', 'name avatar');
};

// Static method to get community entries
journalEntrySchema.statics.getCommunityEntries = function(limit = 20) {
  return this.find({ 
    shareWithCommunity: true,
    isPrivate: false,
    isDeleted: false 
  })
  .sort({ createdAt: -1 })
  .limit(limit)
  .populate('user', 'name avatar')
  .populate('reactions.user', 'name')
  .populate('comments.user', 'name avatar');
};

module.exports = mongoose.model('JournalEntry', journalEntrySchema);