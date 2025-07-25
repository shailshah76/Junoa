const express = require('express');
const { body, validationResult, query } = require('express-validator');
const rateLimit = require('express-rate-limit');

const JournalEntry = require('../models/JournalEntry');
const User = require('../models/User');
const { auth, checkOwnership } = require('../middleware/auth');
const llmService = require('../services/llmService');

const router = express.Router();

// Rate limiting for journal creation
const createEntryLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit each user to 10 journal entries per hour
  message: {
    success: false,
    message: 'Too many journal entries created. Please try again later.'
  }
});

// LLM-powered AI Response generation
const generateAIResponse = async (content, mood, user) => {
  try {
    console.log('🤖 Generating AI response for journal entry...');
    
    // Use LLM service to analyze the journal entry
    const analysis = await llmService.analyzeJournalEntry(content);
    
    // Create AI response object
    const aiResponse = {
      content: analysis.aiComment,
      sentiment: analysis.mood === 'sad' || analysis.mood === 'anxious' || analysis.mood === 'stressed' ? 'negative' :
                 analysis.mood === 'happy' || analysis.mood === 'excited' || analysis.mood === 'grateful' ? 'positive' : 'neutral',
      suggestions: [
        "Consider practicing mindfulness meditation",
        "Try journaling about this experience tomorrow",
        "Remember to be kind to yourself",
        "Consider talking to a trusted friend about this"
      ].slice(0, 2),
      confidence: 0.9,
      generatedAt: new Date()
    };
    
    console.log('✅ AI response generated successfully');
    return aiResponse;
  } catch (error) {
    console.error('❌ Error generating AI response:', error);
    
    // Fallback response if LLM fails
    return {
      content: "Thank you for sharing your thoughts. I appreciate your openness and courage in expressing yourself.",
      sentiment: 'neutral',
      suggestions: ["Remember to be kind to yourself", "Consider talking to a trusted friend about this"],
      confidence: 0.5,
      generatedAt: new Date()
    };
  }
};

// Validation rules
const createEntryValidation = [
  body('content')
    .trim()
    .isLength({ min: 10, max: 5000 })
    .withMessage('Journal content must be between 10 and 5000 characters'),
  
  body('mood')
    .optional()
    .isIn(['calm', 'reflective', 'peaceful', 'anxious', 'sad', 'happy', 'excited', 'grateful', 'angry', 'confused', 'hopeful', 'stressed'])
    .withMessage('Invalid mood value'),
  
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  
  body('tags.*')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Each tag must be 20 characters or less'),
  
  body('isPrivate')
    .optional()
    .isBoolean()
    .withMessage('isPrivate must be a boolean'),
  
  body('shareWithCommunity')
    .optional()
    .isBoolean()
    .withMessage('shareWithCommunity must be a boolean')
];

const updateEntryValidation = [
  body('content')
    .optional()
    .trim()
    .isLength({ min: 10, max: 5000 })
    .withMessage('Journal content must be between 10 and 5000 characters'),
  
  body('mood')
    .optional()
    .isIn(['calm', 'reflective', 'peaceful', 'anxious', 'sad', 'happy', 'excited', 'grateful', 'angry', 'confused', 'hopeful', 'stressed'])
    .withMessage('Invalid mood value'),
  
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array')
];

// @route   POST /api/journal/entries
// @desc    Create a new journal entry
// @access  Private
router.post('/entries', auth, createEntryLimiter, createEntryValidation, async (req, res) => {
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

    const { content, mood, tags, isPrivate, shareWithCommunity, location, emotions } = req.body;

    // Create journal entry
    const journalEntry = new JournalEntry({
      user: req.user.id,
      content: content.trim(),
      mood: mood || 'reflective',
      tags: tags || [],
      isPrivate: isPrivate !== undefined ? isPrivate : true,
      shareWithCommunity: shareWithCommunity || false,
      emotions: emotions || []
    });

    // Add location if provided
    if (location) {
      journalEntry.metadata.location = location;
    }

    await journalEntry.save();

    // Generate AI response and mood analysis
    try {
      const user = await User.findById(req.user.id);
      
      // Use LLM to analyze the journal entry and get mood + AI comment
      const analysis = await llmService.analyzeJournalEntry(content);
      
      // Update the journal entry with LLM-determined mood, AI comment, and activities
      journalEntry.mood = analysis.mood;
      journalEntry.aiComment = analysis.aiComment;
      journalEntry.aiActivities = analysis.activities || [];
      
      // Generate additional AI response for suggestions
      const aiResponse = await generateAIResponse(content, analysis.mood, user);
      await journalEntry.addAIResponse(aiResponse);
      
      // Save the updated entry
      await journalEntry.save();
      
      console.log('✅ Journal entry updated with LLM analysis:', {
        mood: analysis.mood,
        aiCommentLength: analysis.aiComment.length,
        activitiesCount: analysis.activities?.length || 0
      });
    } catch (aiError) {
      console.error('AI response generation failed:', aiError);
      // Continue without AI response if it fails
    }

    // Update user stats
    const user = await User.findById(req.user.id);
    await user.recalculateStats();
    await user.updateStats({
      insightsGained: user.stats.insightsGained + 1
    });

    // Populate the entry for response
    await journalEntry.populate('user', 'name avatar');

    res.status(201).json({
      success: true,
      message: 'Journal entry created successfully',
      data: {
        entry: journalEntry
      }
    });

  } catch (error) {
    console.error('Create journal entry error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating journal entry'
    });
  }
});

// @route   GET /api/journal/entries
// @desc    Get user's journal entries with pagination and filtering
// @access  Private
router.get('/entries', auth, [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('mood')
    .optional()
    .isIn(['calm', 'reflective', 'peaceful', 'anxious', 'sad', 'happy', 'excited', 'grateful', 'angry', 'confused', 'hopeful', 'stressed'])
    .withMessage('Invalid mood filter'),
  
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
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const { mood, search, startDate, endDate } = req.query;

    // Build query
    let query = {
      user: req.user.id,
      isDeleted: false
    };

    if (mood) {
      query.mood = mood;
    }

    if (search) {
      query.$or = [
        { content: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    // Get entries with pagination
    const entries = await JournalEntry.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'name avatar')
      .populate('reactions.user', 'name')
      .populate('comments.user', 'name avatar');

    // Get total count for pagination
    const totalEntries = await JournalEntry.countDocuments(query);
    const totalPages = Math.ceil(totalEntries / limit);

    // Get mood distribution
    const moodStats = await JournalEntry.aggregate([
      { $match: { user: req.user.id, isDeleted: false } },
      { $group: { _id: '$mood', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        entries,
        pagination: {
          currentPage: page,
          totalPages,
          totalEntries,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        },
        stats: {
          moodDistribution: moodStats
        }
      }
    });

  } catch (error) {
    console.error('Get journal entries error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching journal entries'
    });
  }
});

// @route   GET /api/journal/entries/:id
// @desc    Get a specific journal entry
// @access  Private
router.get('/entries/:id', auth, checkOwnership(JournalEntry), async (req, res) => {
  try {
    const entry = req.resource; // Set by checkOwnership middleware

    await entry.populate('user', 'name avatar');
    await entry.populate('reactions.user', 'name');
    await entry.populate('comments.user', 'name avatar');

    res.json({
      success: true,
      data: {
        entry
      }
    });

  } catch (error) {
    console.error('Get journal entry error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching journal entry'
    });
  }
});

// @route   PUT /api/journal/entries/:id
// @desc    Update a journal entry
// @access  Private
router.put('/entries/:id', auth, checkOwnership(JournalEntry), updateEntryValidation, async (req, res) => {
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

    const entry = req.resource; // Set by checkOwnership middleware
    const { content, mood, tags, isPrivate, shareWithCommunity } = req.body;

    // Store original content for edit history
    if (content && content !== entry.content) {
      entry.editHistory.push({
        content: entry.content,
        reason: 'Content updated'
      });
    }

    // Update fields
    if (content) entry.content = content.trim();
    if (mood) entry.mood = mood;
    if (tags !== undefined) entry.tags = tags;
    if (isPrivate !== undefined) entry.isPrivate = isPrivate;
    if (shareWithCommunity !== undefined) entry.shareWithCommunity = shareWithCommunity;

    await entry.save();

    // Regenerate AI response if content changed
    if (content && content !== entry.content) {
      try {
        const user = await User.findById(req.user.id);
        const aiResponse = await generateAIResponse(content, entry.mood, user);
        await entry.addAIResponse(aiResponse);
      } catch (aiError) {
        console.error('AI response regeneration failed:', aiError);
      }
    }

    await entry.populate('user', 'name avatar');

    res.json({
      success: true,
      message: 'Journal entry updated successfully',
      data: {
        entry
      }
    });

  } catch (error) {
    console.error('Update journal entry error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating journal entry'
    });
  }
});

// @route   DELETE /api/journal/entries/:id
// @desc    Delete a journal entry (soft delete)
// @access  Private
router.delete('/entries/:id', auth, checkOwnership(JournalEntry), async (req, res) => {
  try {
    console.log('🗑️ DELETE ROUTE - Entry ID:', req.params.id);
    console.log('🗑️ DELETE ROUTE - User ID:', req.user.id);
    
    const entry = req.resource; // Set by checkOwnership middleware
    console.log('🗑️ DELETE ROUTE - Entry found:', !!entry);
    console.log('🗑️ DELETE ROUTE - Entry before delete:', {
      _id: entry._id,
      isDeleted: entry.isDeleted,
      content: entry.content.substring(0, 50) + '...'
    });

    // Try direct database update instead of save()
    const updateResult = await JournalEntry.findByIdAndUpdate(
      entry._id,
      {
        isDeleted: true,
        deletedAt: new Date()
      },
      { new: true }
    );
    
    console.log('🗑️ DELETE ROUTE - Direct update result:', {
      _id: updateResult._id,
      isDeleted: updateResult.isDeleted,
      deletedAt: updateResult.deletedAt
    });

    // Update user stats
    const user = await User.findById(req.user.id);
    console.log('🗑️ DELETE ROUTE - User found:', !!user);
    console.log('🗑️ DELETE ROUTE - Current journal count:', user.stats.journalEntriesCount);
    
    await user.recalculateStats();
    
    console.log('🗑️ DELETE ROUTE - User stats recalculated');

    res.json({
      success: true,
      message: 'Journal entry deleted successfully'
    });

  } catch (error) {
    console.error('❌ DELETE ROUTE - Error:', error);
    console.error('❌ DELETE ROUTE - Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting journal entry'
    });
  }
});

// @route   POST /api/journal/entries/:id/reactions
// @desc    Add or update reaction to journal entry
// @access  Private
router.post('/entries/:id/reactions', auth, [
  body('type')
    .isIn(['like', 'heart', 'support', 'inspire'])
    .withMessage('Invalid reaction type')
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
    const entry = await JournalEntry.findById(req.params.id);

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Journal entry not found'
      });
    }

    // Check if entry allows reactions (not private or shared with community)
    if (entry.isPrivate && !entry.shareWithCommunity && !entry.user.equals(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Cannot react to private entries'
      });
    }

    await entry.addReaction(req.user.id, type);

    res.json({
      success: true,
      message: 'Reaction added successfully',
      data: {
        reactionCounts: entry.reactionCounts
      }
    });

  } catch (error) {
    console.error('Add reaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding reaction'
    });
  }
});

// @route   DELETE /api/journal/entries/:id/reactions
// @desc    Remove reaction from journal entry
// @access  Private
router.delete('/entries/:id/reactions', auth, async (req, res) => {
  try {
    const entry = await JournalEntry.findById(req.params.id);

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Journal entry not found'
      });
    }

    await entry.removeReaction(req.user.id);

    res.json({
      success: true,
      message: 'Reaction removed successfully',
      data: {
        reactionCounts: entry.reactionCounts
      }
    });

  } catch (error) {
    console.error('Remove reaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while removing reaction'
    });
  }
});

// @route   POST /api/journal/entries/:id/comments
// @desc    Add comment to journal entry
// @access  Private
router.post('/entries/:id/comments', auth, [
  body('content')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Comment must be between 1 and 500 characters')
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

    const { content } = req.body;
    const entry = await JournalEntry.findById(req.params.id);

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Journal entry not found'
      });
    }

    // Check if entry allows comments
    if (entry.isPrivate && !entry.shareWithCommunity && !entry.user.equals(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Cannot comment on private entries'
      });
    }

    await entry.addComment(req.user.id, content.trim());
    await entry.populate('comments.user', 'name avatar');

    res.json({
      success: true,
      message: 'Comment added successfully',
      data: {
        comments: entry.comments
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

// @route   GET /api/journal/stats
// @desc    Get user's journal statistics
// @access  Private
router.get('/stats', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get basic counts
    const totalEntries = await JournalEntry.countDocuments({ 
      user: userId, 
      isDeleted: false 
    });

    // Get mood distribution
    const moodStats = await JournalEntry.aggregate([
      { $match: { user: userId, isDeleted: false } },
      { $group: { _id: '$mood', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Get entries by date (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const entriesByDate = await JournalEntry.aggregate([
      { 
        $match: { 
          user: userId, 
          isDeleted: false,
          createdAt: { $gte: thirtyDaysAgo }
        } 
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get average words per entry
    const avgStats = await JournalEntry.aggregate([
      { $match: { user: userId, isDeleted: false } },
      {
        $group: {
          _id: null,
          avgWordCount: { $avg: '$metadata.wordCount' },
          avgReadingTime: { $avg: '$metadata.readingTime' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        totalEntries,
        moodDistribution: moodStats,
        entriesByDate,
        averages: avgStats[0] || { avgWordCount: 0, avgReadingTime: 0 },
        streakInfo: {
          current: 5, // Calculate actual streak
          longest: 12 // Calculate actual longest streak
        }
      }
    });

  } catch (error) {
    console.error('Get journal stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching journal statistics'
    });
  }
});

module.exports = router;