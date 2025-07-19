const express = require('express');
const { body, validationResult, query } = require('express-validator');
const rateLimit = require('express-rate-limit');

const CommunityPost = require('../models/CommunityPost');
const User = require('../models/User');
const { auth, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Rate limiting for posting
const createPostLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // limit each user to 5 community posts per hour
  message: {
    success: false,
    message: 'Too many community posts created. Please try again later.'
  }
});

// Rate limiting for reactions/comments
const interactionLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // limit each user to 30 interactions per minute
  message: {
    success: false,
    message: 'Too many interactions. Please slow down.'
  }
});

// Validation rules
const createPostValidation = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage('Title must be between 5 and 100 characters'),
  
  body('content')
    .trim()
    .isLength({ min: 20, max: 2000 })
    .withMessage('Content must be between 20 and 2000 characters'),
  
  body('category')
    .optional()
    .isIn(['support', 'inspiration', 'advice', 'milestone', 'question', 'gratitude', 'struggle', 'victory', 'general'])
    .withMessage('Invalid category'),
  
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  
  body('tags.*')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Each tag must be 20 characters or less'),
  
  body('isAnonymous')
    .optional()
    .isBoolean()
    .withMessage('isAnonymous must be a boolean'),
  
  body('triggerWarning.enabled')
    .optional()
    .isBoolean()
    .withMessage('Trigger warning enabled must be a boolean'),
  
  body('triggerWarning.content')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Trigger warning content must be 200 characters or less'),
  
  body('triggerWarning.categories')
    .optional()
    .isArray()
    .withMessage('Trigger warning categories must be an array'),
  
  body('triggerWarning.categories.*')
    .optional()
    .isIn(['self-harm', 'suicide', 'eating-disorder', 'substance-abuse', 'trauma', 'domestic-violence', 'sexual-content'])
    .withMessage('Invalid trigger warning category')
];

const updatePostValidation = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage('Title must be between 5 and 100 characters'),
  
  body('content')
    .optional()
    .trim()
    .isLength({ min: 20, max: 2000 })
    .withMessage('Content must be between 20 and 2000 characters'),
  
  body('category')
    .optional()
    .isIn(['support', 'inspiration', 'advice', 'milestone', 'question', 'gratitude', 'struggle', 'victory', 'general'])
    .withMessage('Invalid category')
];

// @route   GET /api/community/posts
// @desc    Get community posts with pagination and filtering
// @access  Public (with optional auth for personalization)
router.get('/posts', optionalAuth, [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
  
  query('category')
    .optional()
    .isIn(['all', 'support', 'inspiration', 'advice', 'milestone', 'question', 'gratitude', 'struggle', 'victory', 'general'])
    .withMessage('Invalid category filter'),
  
  query('sortBy')
    .optional()
    .isIn(['recent', 'popular', 'trending'])
    .withMessage('Invalid sort option'),
  
  query('search')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search term must be between 1 and 100 characters')
], async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const { category, sortBy, search } = req.query;

    let posts;
    if (search) {
      posts = await CommunityPost.searchPosts(search, { limit, skip: (page - 1) * limit });
    } else {
      posts = await CommunityPost.getCommunityFeed({
        category,
        limit,
        skip: (page - 1) * limit,
        sortBy: sortBy || 'recent'
      });
    }

    // Get total count for pagination
    let totalPosts;
    if (search) {
      totalPosts = await CommunityPost.countDocuments({
        $and: [
          {
            $or: [
              { title: { $regex: search, $options: 'i' } },
              { content: { $regex: search, $options: 'i' } },
              { tags: { $in: [new RegExp(search, 'i')] } }
            ]
          },
          {
            'moderation.isApproved': true,
            'moderation.isHidden': false,
            isDeleted: false
          }
        ]
      });
    } else {
      let countQuery = {
        'moderation.isApproved': true,
        'moderation.isHidden': false,
        isDeleted: false
      };
      if (category && category !== 'all') {
        countQuery.category = category;
      }
      totalPosts = await CommunityPost.countDocuments(countQuery);
    }

    const totalPages = Math.ceil(totalPosts / limit);

    // Get trending topics
    const trendingTopics = await CommunityPost.aggregate([
      {
        $match: {
          'moderation.isApproved': true,
          'moderation.isHidden': false,
          isDeleted: false,
          createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
        }
      },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      success: true,
      data: {
        posts,
        pagination: {
          currentPage: page,
          totalPages,
          totalPosts,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        },
        trendingTopics: trendingTopics.map(topic => topic._id)
      }
    });

  } catch (error) {
    console.error('Get community posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching community posts'
    });
  }
});

// @route   GET /api/community/posts/:id
// @desc    Get a specific community post
// @access  Public (with optional auth)
router.get('/posts/:id', optionalAuth, async (req, res) => {
  try {
    const post = await CommunityPost.findById(req.params.id)
      .populate('author', 'name avatar')
      .populate('likes.user', 'name')
      .populate('supportReactions.user', 'name')
      .populate('comments.author', 'name avatar')
      .populate('comments.replies.author', 'name avatar');

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check if post is approved and not hidden
    if (!post.moderation.isApproved || post.moderation.isHidden || post.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Increment view count
    if (req.user) {
      await post.incrementView(req.user.id);
    } else {
      await post.incrementView();
    }

    res.json({
      success: true,
      data: {
        post
      }
    });

  } catch (error) {
    console.error('Get community post error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching community post'
    });
  }
});

// @route   POST /api/community/posts
// @desc    Create a new community post
// @access  Private
router.post('/posts', auth, createPostLimiter, createPostValidation, async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      title,
      content,
      category,
      tags,
      isAnonymous,
      mood,
      triggerWarning
    } = req.body;

    // Create community post
    const post = new CommunityPost({
      author: req.user.id,
      title: title.trim(),
      content: content.trim(),
      category: category || 'general',
      tags: tags || [],
      isAnonymous: isAnonymous || false,
      mood: mood || 'neutral',
      triggerWarning: triggerWarning || { enabled: false }
    });

    await post.save();

    // Populate the post for response
    await post.populate('author', 'name avatar');

    res.status(201).json({
      success: true,
      message: 'Community post created successfully',
      data: {
        post
      }
    });

  } catch (error) {
    console.error('Create community post error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating community post'
    });
  }
});

// @route   PUT /api/community/posts/:id
// @desc    Update a community post
// @access  Private (author only)
router.put('/posts/:id', auth, updatePostValidation, async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const post = await CommunityPost.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check if user is the author
    if (!post.author.equals(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only edit your own posts.'
      });
    }

    // Check if post is locked
    if (post.isLocked) {
      return res.status(403).json({
        success: false,
        message: 'Post is locked and cannot be edited'
      });
    }

    const { title, content, category, tags } = req.body;

    // Update fields
    if (title) post.title = title.trim();
    if (content) post.content = content.trim();
    if (category) post.category = category;
    if (tags !== undefined) post.tags = tags;

    await post.save();
    await post.populate('author', 'name avatar');

    res.json({
      success: true,
      message: 'Post updated successfully',
      data: {
        post
      }
    });

  } catch (error) {
    console.error('Update community post error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating community post'
    });
  }
});

// @route   DELETE /api/community/posts/:id
// @desc    Delete a community post
// @access  Private (author only)
router.delete('/posts/:id', auth, async (req, res) => {
  try {
    const post = await CommunityPost.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check if user is the author
    if (!post.author.equals(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only delete your own posts.'
      });
    }

    // Soft delete
    post.isDeleted = true;
    post.deletedAt = new Date();
    await post.save();

    res.json({
      success: true,
      message: 'Post deleted successfully'
    });

  } catch (error) {
    console.error('Delete community post error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting community post'
    });
  }
});

// @route   POST /api/community/posts/:id/like
// @desc    Like or unlike a community post
// @access  Private
router.post('/posts/:id/like', auth, interactionLimiter, async (req, res) => {
  try {
    const post = await CommunityPost.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check if post is accessible
    if (!post.moderation.isApproved || post.moderation.isHidden || post.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check if user already liked
    const existingLike = post.likes.find(like => like.user.equals(req.user.id));

    if (existingLike) {
      // Unlike
      await post.removeLike(req.user.id);
      return res.json({
        success: true,
        message: 'Post unliked successfully',
        data: {
          liked: false,
          likesCount: post.likesCount
        }
      });
    } else {
      // Like
      await post.addLike(req.user.id);
      return res.json({
        success: true,
        message: 'Post liked successfully',
        data: {
          liked: true,
          likesCount: post.likesCount
        }
      });
    }

  } catch (error) {
    console.error('Toggle like error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while toggling like'
    });
  }
});

// @route   POST /api/community/posts/:id/support
// @desc    Add support reaction to a community post
// @access  Private
router.post('/posts/:id/support', auth, interactionLimiter, [
  body('type')
    .isIn(['heart', 'hug', 'strength', 'hope', 'solidarity'])
    .withMessage('Invalid support reaction type')
], async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { type } = req.body;
    const post = await CommunityPost.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check if post is accessible
    if (!post.moderation.isApproved || post.moderation.isHidden || post.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    await post.addSupportReaction(req.user.id, type);

    res.json({
      success: true,
      message: 'Support reaction added successfully',
      data: {
        supportReactionCounts: post.supportReactionCounts
      }
    });

  } catch (error) {
    console.error('Add support reaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding support reaction'
    });
  }
});

// @route   POST /api/community/posts/:id/comments
// @desc    Add a comment to a community post
// @access  Private
router.post('/posts/:id/comments', auth, interactionLimiter, [
  body('content')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Comment must be between 1 and 1000 characters'),
  
  body('isAnonymous')
    .optional()
    .isBoolean()
    .withMessage('isAnonymous must be a boolean')
], async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { content, isAnonymous } = req.body;
    const post = await CommunityPost.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check if post is accessible and not locked
    if (!post.moderation.isApproved || post.moderation.isHidden || post.isDeleted || post.isLocked) {
      return res.status(403).json({
        success: false,
        message: 'Cannot comment on this post'
      });
    }

    await post.addComment(req.user.id, content.trim(), isAnonymous || false);
    await post.populate('comments.author', 'name avatar');

    res.json({
      success: true,
      message: 'Comment added successfully',
      data: {
        comments: post.comments
      }
    });

  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding comment'
    });
  }
});

// @route   POST /api/community/posts/:id/bookmark
// @desc    Bookmark or unbookmark a community post
// @access  Private
router.post('/posts/:id/bookmark', auth, async (req, res) => {
  try {
    const post = await CommunityPost.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check if post is accessible
    if (!post.moderation.isApproved || post.moderation.isHidden || post.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check if user already bookmarked
    const existingBookmark = post.bookmarks.find(bookmark => bookmark.user.equals(req.user.id));

    if (existingBookmark) {
      // Remove bookmark
      await post.removeBookmark(req.user.id);
      return res.json({
        success: true,
        message: 'Bookmark removed successfully',
        data: {
          bookmarked: false
        }
      });
    } else {
      // Add bookmark
      await post.addBookmark(req.user.id);
      return res.json({
        success: true,
        message: 'Post bookmarked successfully',
        data: {
          bookmarked: true
        }
      });
    }

  } catch (error) {
    console.error('Toggle bookmark error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while toggling bookmark'
    });
  }
});

// @route   POST /api/community/posts/:id/report
// @desc    Report a community post
// @access  Private
router.post('/posts/:id/report', auth, [
  body('reason')
    .isIn(['spam', 'harassment', 'inappropriate', 'self-harm', 'misinformation', 'other'])
    .withMessage('Invalid report reason'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must be 500 characters or less')
], async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { reason, description } = req.body;
    const post = await CommunityPost.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check if user already reported this post
    const existingReport = post.reports.find(report => report.reporter.equals(req.user.id));
    if (existingReport) {
      return res.status(400).json({
        success: false,
        message: 'You have already reported this post'
      });
    }

    await post.addReport(req.user.id, reason, description);

    res.json({
      success: true,
      message: 'Post reported successfully. Thank you for helping keep our community safe.'
    });

  } catch (error) {
    console.error('Report post error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while reporting post'
    });
  }
});

// @route   GET /api/community/my-posts
// @desc    Get current user's community posts
// @access  Private
router.get('/my-posts', auth, [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50')
], async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const posts = await CommunityPost.find({
      author: req.user.id,
      isDeleted: false
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('author', 'name avatar');

    const totalPosts = await CommunityPost.countDocuments({
      author: req.user.id,
      isDeleted: false
    });

    const totalPages = Math.ceil(totalPosts / limit);

    res.json({
      success: true,
      data: {
        posts,
        pagination: {
          currentPage: page,
          totalPages,
          totalPosts,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get my posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching your posts'
    });
  }
});

// @route   GET /api/community/bookmarks
// @desc    Get current user's bookmarked posts
// @access  Private
router.get('/bookmarks', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const posts = await CommunityPost.find({
      'bookmarks.user': req.user.id,
      'moderation.isApproved': true,
      'moderation.isHidden': false,
      isDeleted: false
    })
    .sort({ 'bookmarks.createdAt': -1 })
    .skip(skip)
    .limit(limit)
    .populate('author', 'name avatar');

    const totalPosts = await CommunityPost.countDocuments({
      'bookmarks.user': req.user.id,
      'moderation.isApproved': true,
      'moderation.isHidden': false,
      isDeleted: false
    });

    const totalPages = Math.ceil(totalPosts / limit);

    res.json({
      success: true,
      data: {
        posts,
        pagination: {
          currentPage: page,
          totalPages,
          totalPosts,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get bookmarks error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching bookmarks'
    });
  }
});

module.exports = router;