const express = require('express');
const { body, validationResult } = require('express-validator');

const User = require('../models/User');
const JournalEntry = require('../models/JournalEntry');
const CommunityPost = require('../models/CommunityPost');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/profile/dashboard
// @desc    Get user dashboard data
// @access  Private
router.get('/dashboard', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user with stats
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get recent journal entries
    const recentEntries = await JournalEntry.find({
      user: userId,
      isDeleted: false
    })
    .sort({ createdAt: -1 })
    .limit(5)
    .select('content preview mood createdAt aiResponse.content');

    // Get mood trends (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const moodTrends = await JournalEntry.aggregate([
      {
        $match: {
          user: userId,
          isDeleted: false,
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            mood: "$mood"
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: "$_id.date",
          moods: {
            $push: {
              mood: "$_id.mood",
              count: "$count"
            }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get writing streaks
    const allEntries = await JournalEntry.find({
      user: userId,
      isDeleted: false
    })
    .sort({ createdAt: -1 })
    .select('createdAt');

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let previousDate = null;

    for (let i = 0; i < allEntries.length; i++) {
      const entryDate = new Date(allEntries[i].createdAt);
      entryDate.setHours(0, 0, 0, 0);

      if (i === 0) {
        // Check if today or yesterday
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (entryDate.getTime() === today.getTime() || entryDate.getTime() === yesterday.getTime()) {
          currentStreak = 1;
          tempStreak = 1;
        }
      } else {
        const daysDiff = Math.floor((previousDate - entryDate) / (1000 * 60 * 60 * 24));
        
        if (daysDiff === 1) {
          tempStreak++;
          if (i === 1 || currentStreak > 0) {
            currentStreak = tempStreak;
          }
        } else {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
          if (currentStreak === 0 && i === 1) {
            currentStreak = 0;
          }
        }
      }
      
      previousDate = entryDate;
    }
    
    longestStreak = Math.max(longestStreak, tempStreak);

    // Get recent community interactions
    const recentCommunityPosts = await CommunityPost.find({
      author: userId,
      isDeleted: false
    })
    .sort({ createdAt: -1 })
    .limit(3)
    .select('title createdAt likesCount commentsCount');

    // Get upcoming goals/reminders (simulated)
    const upcomingReminders = [
      {
        type: 'journal',
        title: 'Daily Journal Reminder',
        time: '20:00',
        enabled: user.preferences.dailyReminders
      },
      {
        type: 'reflection',
        title: 'Weekly Reflection',
        time: 'Sunday',
        enabled: true
      }
    ];

    res.json({
      success: true,
      data: {
        user: {
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          stats: user.stats,
          preferences: user.preferences
        },
        recentEntries,
        moodTrends,
        streaks: {
          current: currentStreak,
          longest: longestStreak
        },
        recentCommunityPosts,
        upcomingReminders
      }
    });

  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching dashboard data'
    });
  }
});

// @route   GET /api/profile/analytics
// @desc    Get detailed user analytics
// @access  Private
router.get('/analytics', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { timeframe = '30d' } = req.query;

    // Calculate date range
    let startDate = new Date();
    switch (timeframe) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(startDate.getDate() - 30);
    }

    // Journal analytics
    const journalAnalytics = await JournalEntry.aggregate([
      {
        $match: {
          user: userId,
          isDeleted: false,
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          totalEntries: { $sum: 1 },
          totalWords: { $sum: '$metadata.wordCount' },
          avgWordsPerEntry: { $avg: '$metadata.wordCount' },
          avgReadingTime: { $avg: '$metadata.readingTime' },
          moods: { $push: '$mood' },
          emotions: { $push: '$emotions' }
        }
      }
    ]);

    // Mood distribution
    const moodDistribution = await JournalEntry.aggregate([
      {
        $match: {
          user: userId,
          isDeleted: false,
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$mood',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Daily writing pattern
    const dailyPattern = await JournalEntry.aggregate([
      {
        $match: {
          user: userId,
          isDeleted: false,
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
          totalWords: { $sum: '$metadata.wordCount' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Hour of day pattern
    const hourlyPattern = await JournalEntry.aggregate([
      {
        $match: {
          user: userId,
          isDeleted: false,
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: { $hour: '$createdAt' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Sentiment analysis over time (based on mood)
    const sentimentTrend = await JournalEntry.aggregate([
      {
        $match: {
          user: userId,
          isDeleted: false,
          createdAt: { $gte: startDate }
        }
      },
      {
        $addFields: {
          sentimentScore: {
            $switch: {
              branches: [
                { case: { $in: ['$mood', ['happy', 'excited', 'grateful', 'peaceful', 'calm']] }, then: 1 },
                { case: { $in: ['$mood', ['sad', 'angry', 'anxious', 'stressed']] }, then: -1 }
              ],
              default: 0
            }
          }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          avgSentiment: { $avg: '$sentimentScore' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Community engagement
    const communityAnalytics = await CommunityPost.aggregate([
      {
        $match: {
          author: userId,
          isDeleted: false,
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          totalPosts: { $sum: 1 },
          totalLikes: { $sum: { $size: '$likes' } },
          totalComments: { $sum: { $size: '$comments' } },
          totalViews: { $sum: '$engagement.views' }
        }
      }
    ]);

    // AI interaction stats
    const aiInteractionStats = await JournalEntry.aggregate([
      {
        $match: {
          user: userId,
          isDeleted: false,
          createdAt: { $gte: startDate },
          'aiResponse.content': { $exists: true }
        }
      },
      {
        $group: {
          _id: null,
          totalAIResponses: { $sum: 1 },
          avgConfidence: { $avg: '$aiResponse.confidence' },
          sentiments: { $push: '$aiResponse.sentiment' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        timeframe,
        journal: journalAnalytics[0] || {
          totalEntries: 0,
          totalWords: 0,
          avgWordsPerEntry: 0,
          avgReadingTime: 0
        },
        moodDistribution,
        dailyPattern,
        hourlyPattern,
        sentimentTrend,
        community: communityAnalytics[0] || {
          totalPosts: 0,
          totalLikes: 0,
          totalComments: 0,
          totalViews: 0
        },
        aiInteraction: aiInteractionStats[0] || {
          totalAIResponses: 0,
          avgConfidence: 0
        }
      }
    });

  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching analytics data'
    });
  }
});

// @route   PUT /api/profile/preferences
// @desc    Update user preferences
// @access  Private
router.put('/preferences', auth, [
  body('emailNotifications')
    .optional()
    .isBoolean()
    .withMessage('emailNotifications must be a boolean'),
  
  body('dailyReminders')
    .optional()
    .isBoolean()
    .withMessage('dailyReminders must be a boolean'),
  
  body('communityUpdates')
    .optional()
    .isBoolean()
    .withMessage('communityUpdates must be a boolean'),
  
  body('darkMode')
    .optional()
    .isBoolean()
    .withMessage('darkMode must be a boolean'),
  
  body('reminderTime')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('reminderTime must be in HH:MM format'),
  
  body('language')
    .optional()
    .isIn(['en', 'es', 'fr', 'de', 'it', 'pt'])
    .withMessage('Invalid language code')
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

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update preferences
    const updatedPreferences = { ...user.preferences, ...req.body };
    user.preferences = updatedPreferences;

    await user.save();

    res.json({
      success: true,
      message: 'Preferences updated successfully',
      data: {
        preferences: user.preferences
      }
    });

  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating preferences'
    });
  }
});

// @route   GET /api/profile/export
// @desc    Export user data
// @access  Private
router.get('/export', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { format = 'json' } = req.query;

    // Get user data
    const user = await User.findById(userId).select('-password');
    
    // Get journal entries
    const journalEntries = await JournalEntry.find({
      user: userId,
      isDeleted: false
    }).sort({ createdAt: -1 });

    // Get community posts
    const communityPosts = await CommunityPost.find({
      author: userId,
      isDeleted: false
    }).sort({ createdAt: -1 });

    const exportData = {
      user: {
        name: user.name,
        email: user.email,
        preferences: user.preferences,
        stats: user.stats,
        createdAt: user.createdAt
      },
      journalEntries: journalEntries.map(entry => ({
        content: entry.content,
        mood: entry.mood,
        tags: entry.tags,
        emotions: entry.emotions,
        aiResponse: entry.aiResponse,
        createdAt: entry.createdAt
      })),
      communityPosts: communityPosts.map(post => ({
        title: post.title,
        content: post.content,
        category: post.category,
        tags: post.tags,
        mood: post.mood,
        likesCount: post.likesCount,
        commentsCount: post.commentsCount,
        createdAt: post.createdAt
      })),
      exportedAt: new Date()
    };

    if (format === 'csv') {
      // Convert to CSV format for journal entries
      const csv = [
        'Date,Mood,Content,AI Response',
        ...journalEntries.map(entry => 
          `"${entry.createdAt.toISOString()}","${entry.mood}","${entry.content.replace(/"/g, '""')}","${entry.aiResponse?.content?.replace(/"/g, '""') || ''}"`
        )
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="junoa-journal-export.csv"');
      return res.send(csv);
    }

    // Default JSON format
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="junoa-data-export.json"');
    res.json(exportData);

  } catch (error) {
    console.error('Export data error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while exporting data'
    });
  }
});

// @route   GET /api/profile/goals
// @desc    Get user goals and achievements
// @access  Private
router.get('/goals', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    // Calculate achievement progress
    const totalEntries = await JournalEntry.countDocuments({
      user: userId,
      isDeleted: false
    });

    const currentDate = new Date();
    const startOfWeek = new Date(currentDate.setDate(currentDate.getDate() - currentDate.getDay()));
    const entriesThisWeek = await JournalEntry.countDocuments({
      user: userId,
      isDeleted: false,
      createdAt: { $gte: startOfWeek }
    });

    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const entriesThisMonth = await JournalEntry.countDocuments({
      user: userId,
      isDeleted: false,
      createdAt: { $gte: startOfMonth }
    });

    // Define achievements
    const achievements = [
      {
        id: 'first_entry',
        title: 'First Steps',
        description: 'Write your first journal entry',
        progress: Math.min(totalEntries, 1),
        target: 1,
        unlocked: totalEntries >= 1,
        category: 'writing'
      },
      {
        id: 'week_warrior',
        title: 'Week Warrior',
        description: 'Write 7 entries in a week',
        progress: entriesThisWeek,
        target: 7,
        unlocked: entriesThisWeek >= 7,
        category: 'consistency'
      },
      {
        id: 'monthly_master',
        title: 'Monthly Master',
        description: 'Write 30 entries in a month',
        progress: entriesThisMonth,
        target: 30,
        unlocked: entriesThisMonth >= 30,
        category: 'consistency'
      },
      {
        id: 'prolific_writer',
        title: 'Prolific Writer',
        description: 'Write 100 total entries',
        progress: totalEntries,
        target: 100,
        unlocked: totalEntries >= 100,
        category: 'milestones'
      },
      {
        id: 'streak_master',
        title: 'Streak Master',
        description: 'Maintain a 30-day writing streak',
        progress: user.stats.streak,
        target: 30,
        unlocked: user.stats.streak >= 30,
        category: 'consistency'
      }
    ];

    // Calculate current goals
    const goals = [
      {
        id: 'daily_writing',
        title: 'Daily Writing',
        description: 'Write in your journal every day',
        type: 'daily',
        progress: entriesThisWeek >= 7 ? 7 : entriesThisWeek,
        target: 7,
        timeframe: 'week'
      },
      {
        id: 'mood_tracking',
        title: 'Mood Awareness',
        description: 'Track your mood with each entry',
        type: 'habit',
        progress: 85, // Simulated percentage
        target: 100,
        timeframe: 'ongoing'
      },
      {
        id: 'self_reflection',
        title: 'Deep Reflection',
        description: 'Write entries longer than 200 words',
        type: 'quality',
        progress: 12, // Simulated count
        target: 20,
        timeframe: 'month'
      }
    ];

    res.json({
      success: true,
      data: {
        achievements,
        goals,
        stats: {
          totalAchievements: achievements.filter(a => a.unlocked).length,
          totalPossible: achievements.length,
          completedGoals: goals.filter(g => g.progress >= g.target).length,
          activeGoals: goals.length
        }
      }
    });

  } catch (error) {
    console.error('Get goals error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching goals and achievements'
    });
  }
});

// @route   GET /api/profile/insights
// @desc    Get personalized insights based on user data
// @access  Private
router.get('/insights', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get recent mood patterns
    const recentMoods = await JournalEntry.aggregate([
      {
        $match: {
          user: userId,
          isDeleted: false,
          createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: '$mood',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get writing patterns
    const writingTimes = await JournalEntry.aggregate([
      {
        $match: {
          user: userId,
          isDeleted: false,
          createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: { $hour: '$createdAt' },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 1 }
    ]);

    // Generate insights
    const insights = [];

    // Mood insights
    if (recentMoods.length > 0) {
      const dominantMood = recentMoods[0];
      if (dominantMood._id === 'anxious' || dominantMood._id === 'stressed') {
        insights.push({
          type: 'mood',
          title: 'Managing Stress',
          message: `You've been feeling ${dominantMood._id} frequently. Consider trying breathing exercises or short walks to help manage stress.`,
          actionable: true,
          priority: 'high'
        });
      } else if (dominantMood._id === 'happy' || dominantMood._id === 'grateful') {
        insights.push({
          type: 'mood',
          title: 'Positive Patterns',
          message: `Great job maintaining a positive mindset! You've been feeling ${dominantMood._id} often this month.`,
          actionable: false,
          priority: 'medium'
        });
      }
    }

    // Writing pattern insights
    if (writingTimes.length > 0) {
      const bestHour = writingTimes[0]._id;
      const timeOfDay = bestHour < 12 ? 'morning' : bestHour < 18 ? 'afternoon' : 'evening';
      
      insights.push({
        type: 'habit',
        title: 'Optimal Writing Time',
        message: `You write most often in the ${timeOfDay} (around ${bestHour}:00). Consider setting a daily reminder for this time.`,
        actionable: true,
        priority: 'medium'
      });
    }

    // Streak insights
    const user = await User.findById(userId);
    if (user.stats.streak > 0) {
      insights.push({
        type: 'achievement',
        title: 'Writing Streak',
        message: `You're on a ${user.stats.streak}-day writing streak! Keep it up to build a lasting habit.`,
        actionable: false,
        priority: 'medium'
      });
    }

    // Word count insights
    const avgWordCount = await JournalEntry.aggregate([
      {
        $match: {
          user: userId,
          isDeleted: false,
          createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: null,
          avgWords: { $avg: '$metadata.wordCount' }
        }
      }
    ]);

    if (avgWordCount.length > 0 && avgWordCount[0].avgWords > 150) {
      insights.push({
        type: 'writing',
        title: 'Thoughtful Reflection',
        message: `Your entries average ${Math.round(avgWordCount[0].avgWords)} words. This shows you're taking time for deep reflection.`,
        actionable: false,
        priority: 'low'
      });
    }

    res.json({
      success: true,
      data: {
        insights,
        lastUpdated: new Date()
      }
    });

  } catch (error) {
    console.error('Get insights error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while generating insights'
    });
  }
});

module.exports = router;