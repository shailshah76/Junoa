const mongoose = require('mongoose');

const communityPostSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Author is required']
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    minlength: [5, 'Title must be at least 5 characters'],
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  content: {
    type: String,
    required: [true, 'Content is required'],
    minlength: [20, 'Content must be at least 20 characters'],
    maxlength: [2000, 'Content cannot exceed 2000 characters']
  },
  preview: {
    type: String,
    maxlength: [200, 'Preview cannot exceed 200 characters']
  },
  category: {
    type: String,
    enum: {
      values: ['support', 'inspiration', 'advice', 'milestone', 'question', 'gratitude', 'struggle', 'victory', 'general'],
      message: 'Category must be one of the valid options'
    },
    default: 'general'
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
    maxlength: 20
  }],
  isAnonymous: {
    type: Boolean,
    default: false
  },
  mood: {
    type: String,
    enum: ['positive', 'neutral', 'negative', 'hopeful', 'grateful', 'struggling'],
    default: 'neutral'
  },
  triggerWarning: {
    enabled: {
      type: Boolean,
      default: false
    },
    content: String,
    categories: [{
      type: String,
      enum: ['self-harm', 'suicide', 'eating-disorder', 'substance-abuse', 'trauma', 'domestic-violence', 'sexual-content']
    }]
  },
  likes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  supportReactions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    type: {
      type: String,
      enum: ['heart', 'hug', 'strength', 'hope', 'solidarity']
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  comments: [{
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    content: {
      type: String,
      required: true,
      maxlength: 1000
    },
    isAnonymous: {
      type: Boolean,
      default: false
    },
    likes: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }],
    replies: [{
      author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      content: {
        type: String,
        required: true,
        maxlength: 500
      },
      isAnonymous: {
        type: Boolean,
        default: false
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }],
    isReported: {
      type: Boolean,
      default: false
    },
    isDeleted: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  bookmarks: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  reports: [{
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: {
      type: String,
      enum: ['spam', 'harassment', 'inappropriate', 'self-harm', 'misinformation', 'other'],
      required: true
    },
    description: String,
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'resolved', 'dismissed'],
      default: 'pending'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  moderation: {
    isApproved: {
      type: Boolean,
      default: true
    },
    isHidden: {
      type: Boolean,
      default: false
    },
    moderatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    moderationReason: String,
    moderatedAt: Date
  },
  engagement: {
    views: {
      type: Number,
      default: 0
    },
    uniqueViewers: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      viewedAt: {
        type: Date,
        default: Date.now
      }
    }],
    shareCount: {
      type: Number,
      default: 0
    }
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  isLocked: {
    type: Boolean,
    default: false
  },
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

// Indexes for better performance
communityPostSchema.index({ author: 1, createdAt: -1 });
communityPostSchema.index({ category: 1, createdAt: -1 });
communityPostSchema.index({ tags: 1 });
communityPostSchema.index({ 'moderation.isApproved': 1, 'moderation.isHidden': 1 });
communityPostSchema.index({ isPinned: -1, createdAt: -1 });

// Virtual for like count
communityPostSchema.virtual('likesCount').get(function() {
  return this.likes.length;
});

// Virtual for comment count
communityPostSchema.virtual('commentsCount').get(function() {
  return this.comments.filter(comment => !comment.isDeleted).length;
});

// Virtual for support reaction counts
communityPostSchema.virtual('supportReactionCounts').get(function() {
  const counts = {};
  this.supportReactions.forEach(reaction => {
    counts[reaction.type] = (counts[reaction.type] || 0) + 1;
  });
  return counts;
});

// Virtual for author display name
communityPostSchema.virtual('authorDisplayName').get(function() {
  if (this.isAnonymous) {
    return 'Anonymous';
  }
  return this.populated('author') ? this.author.name : 'Anonymous';
});

// Pre-save middleware
communityPostSchema.pre('save', function(next) {
  // Generate preview if not provided
  if (!this.preview && this.content) {
    this.preview = this.content.length > 197 
      ? this.content.substring(0, 197) + '...'
      : this.content;
  }
  
  this.updatedAt = Date.now();
  next();
});

// Instance method to add like
communityPostSchema.methods.addLike = async function(userId) {
  // Check if user already liked
  const existingLike = this.likes.find(like => like.user.equals(userId));
  if (existingLike) {
    return this; // Already liked
  }
  
  this.likes.push({ user: userId });
  await this.save();
  return this;
};

// Instance method to remove like
communityPostSchema.methods.removeLike = async function(userId) {
  this.likes = this.likes.filter(like => !like.user.equals(userId));
  await this.save();
  return this;
};

// Instance method to add support reaction
communityPostSchema.methods.addSupportReaction = async function(userId, reactionType) {
  // Remove existing reaction from this user
  this.supportReactions = this.supportReactions.filter(
    reaction => !reaction.user.equals(userId)
  );
  
  // Add new reaction
  this.supportReactions.push({
    user: userId,
    type: reactionType
  });
  
  await this.save();
  return this;
};

// Instance method to add comment
communityPostSchema.methods.addComment = async function(authorId, content, isAnonymous = false) {
  this.comments.push({
    author: authorId,
    content: content,
    isAnonymous: isAnonymous
  });
  
  await this.save();
  return this;
};

// Instance method to bookmark post
communityPostSchema.methods.addBookmark = async function(userId) {
  // Check if already bookmarked
  const existingBookmark = this.bookmarks.find(bookmark => bookmark.user.equals(userId));
  if (existingBookmark) {
    return this;
  }
  
  this.bookmarks.push({ user: userId });
  await this.save();
  return this;
};

// Instance method to remove bookmark
communityPostSchema.methods.removeBookmark = async function(userId) {
  this.bookmarks = this.bookmarks.filter(bookmark => !bookmark.user.equals(userId));
  await this.save();
  return this;
};

// Instance method to increment view
communityPostSchema.methods.incrementView = async function(userId) {
  this.engagement.views += 1;
  
  // Add to unique viewers if not already viewed
  if (userId && !this.engagement.uniqueViewers.find(viewer => viewer.user.equals(userId))) {
    this.engagement.uniqueViewers.push({ user: userId });
  }
  
  await this.save();
  return this;
};

// Instance method to report post
communityPostSchema.methods.addReport = async function(reporterId, reason, description) {
  this.reports.push({
    reporter: reporterId,
    reason: reason,
    description: description
  });
  
  await this.save();
  return this;
};

// Static method to get community feed
communityPostSchema.statics.getCommunityFeed = function(options = {}) {
  const {
    category,
    limit = 20,
    skip = 0,
    sortBy = 'recent' // recent, popular, trending
  } = options;
  
  let query = {
    'moderation.isApproved': true,
    'moderation.isHidden': false,
    isDeleted: false
  };
  
  if (category && category !== 'all') {
    query.category = category;
  }
  
  let sort = {};
  switch (sortBy) {
    case 'popular':
      sort = { 'likes.length': -1, createdAt: -1 };
      break;
    case 'trending':
      // Sort by engagement in last 24 hours
      sort = { 'engagement.views': -1, createdAt: -1 };
      break;
    default:
      sort = { isPinned: -1, createdAt: -1 };
  }
  
  return this.find(query)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .populate('author', 'name avatar')
    .populate('likes.user', 'name')
    .populate('supportReactions.user', 'name')
    .populate('comments.author', 'name avatar');
};

// Static method to search posts
communityPostSchema.statics.searchPosts = function(searchTerm, options = {}) {
  const { limit = 20, skip = 0 } = options;
  
  return this.find({
    $and: [
      {
        $or: [
          { title: { $regex: searchTerm, $options: 'i' } },
          { content: { $regex: searchTerm, $options: 'i' } },
          { tags: { $in: [new RegExp(searchTerm, 'i')] } }
        ]
      },
      {
        'moderation.isApproved': true,
        'moderation.isHidden': false,
        isDeleted: false
      }
    ]
  })
  .sort({ createdAt: -1 })
  .skip(skip)
  .limit(limit)
  .populate('author', 'name avatar');
};

module.exports = mongoose.model('CommunityPost', communityPostSchema);