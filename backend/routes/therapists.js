const express = require('express');
const { body, validationResult, query } = require('express-validator');

const Therapist = require('../models/Therapist');
const { auth, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/therapists
// @desc    Get therapists with filtering and pagination
// @access  Public (with optional auth for personalization)
router.get('/', optionalAuth, [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
  
  query('latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  
  query('longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  
  query('maxDistance')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Max distance must be between 1 and 100 miles'),
  
  query('specialties')
    .optional()
    .isString()
    .withMessage('Specialties must be a comma-separated string'),
  
  query('minRating')
    .optional()
    .isFloat({ min: 0, max: 5 })
    .withMessage('Minimum rating must be between 0 and 5'),
  
  query('acceptsInsurance')
    .optional()
    .isBoolean()
    .withMessage('acceptsInsurance must be a boolean'),
  
  query('acceptNewClients')
    .optional()
    .isBoolean()
    .withMessage('acceptNewClients must be a boolean'),
  
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
    const skip = (page - 1) * limit;

    const {
      latitude,
      longitude,
      maxDistance,
      specialties,
      minRating,
      acceptsInsurance,
      acceptNewClients,
      search
    } = req.query;

    let therapists;
    let totalTherapists;

    // If search term provided, use search function
    if (search) {
      therapists = await Therapist.searchTherapists(search, { limit, skip });
      totalTherapists = await Therapist.countDocuments({
        $and: [
          {
            $or: [
              { name: { $regex: search, $options: 'i' } },
              { specialties: { $in: [new RegExp(search, 'i')] } },
              { approaches: { $in: [new RegExp(search, 'i')] } },
              { 'location.address.city': { $regex: search, $options: 'i' } }
            ]
          },
          { status: 'active' }
        ]
      });
    }
    // If location provided, use location-based search
    else if (latitude && longitude) {
      const options = {
        specialties: specialties ? specialties.split(',') : undefined,
        minRating: minRating ? parseFloat(minRating) : 0,
        acceptsInsurance: acceptsInsurance !== undefined ? acceptsInsurance === 'true' : undefined,
        acceptNewClients: acceptNewClients !== undefined ? acceptNewClients === 'true' : true,
        limit
      };

      therapists = await Therapist.findByLocation(
        parseFloat(latitude),
        parseFloat(longitude),
        maxDistance ? parseInt(maxDistance) : 25,
        options
      );

      // Count total for pagination (approximate, as we can't easily count with geoNear)
      totalTherapists = Math.min(therapists.length + limit, 1000);
    }
    // Default query
    else {
      let query = { status: 'active' };

      if (specialties) {
        query.specialties = { $in: specialties.split(',') };
      }

      if (minRating) {
        query['ratings.average'] = { $gte: parseFloat(minRating) };
      }

      if (acceptsInsurance !== undefined) {
        query['pricing.acceptsInsurance'] = acceptsInsurance === 'true';
      }

      if (acceptNewClients !== undefined) {
        query['preferences.acceptNewClients'] = acceptNewClients === 'true';
      }

      therapists = await Therapist.find(query)
        .sort({ 'ratings.average': -1, 'ratings.totalReviews': -1 })
        .skip(skip)
        .limit(limit);

      totalTherapists = await Therapist.countDocuments(query);
    }

    const totalPages = Math.ceil(totalTherapists / limit);

    // Get specialty aggregation for filters
    const specialtyStats = await Therapist.aggregate([
      { $match: { status: 'active' } },
      { $unwind: '$specialties' },
      { $group: { _id: '$specialties', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 }
    ]);

    // Increment profile views for authenticated users
    if (req.user) {
      const therapistIds = therapists.map(t => t._id);
      await Therapist.updateMany(
        { _id: { $in: therapistIds } },
        { $inc: { 'analytics.profileViews': 1 } }
      );
    }

    res.json({
      success: true,
      data: {
        therapists,
        pagination: {
          currentPage: page,
          totalPages,
          totalTherapists,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        },
        filters: {
          specialties: specialtyStats.map(s => s._id)
        }
      }
    });

  } catch (error) {
    console.error('Get therapists error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching therapists'
    });
  }
});

// @route   GET /api/therapists/:id
// @desc    Get a specific therapist
// @access  Public (with optional auth)
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const therapist = await Therapist.findById(req.params.id);

    if (!therapist) {
      return res.status(404).json({
        success: false,
        message: 'Therapist not found'
      });
    }

    // Check if therapist is active
    if (therapist.status !== 'active') {
      return res.status(404).json({
        success: false,
        message: 'Therapist not found'
      });
    }

    // Increment profile views
    if (req.user) {
      await therapist.incrementProfileViews();
    }

    // Get similar therapists (same specialties, nearby location)
    const similarTherapists = await Therapist.find({
      _id: { $ne: therapist._id },
      status: 'active',
      specialties: { $in: therapist.specialties },
      'location.address.city': therapist.location.address.city
    })
    .limit(5)
    .sort({ 'ratings.average': -1 });

    res.json({
      success: true,
      data: {
        therapist,
        similarTherapists
      }
    });

  } catch (error) {
    console.error('Get therapist error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching therapist'
    });
  }
});

// @route   POST /api/therapists/:id/contact
// @desc    Contact a therapist (increment contact requests)
// @access  Private
router.post('/:id/contact', auth, async (req, res) => {
  try {
    const therapist = await Therapist.findById(req.params.id);

    if (!therapist) {
      return res.status(404).json({
        success: false,
        message: 'Therapist not found'
      });
    }

    // Check if therapist is active and accepts new clients
    if (therapist.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Therapist is not currently available'
      });
    }

    if (!therapist.preferences.acceptNewClients) {
      return res.status(400).json({
        success: false,
        message: 'Therapist is not accepting new clients at this time'
      });
    }

    // Increment contact requests
    await therapist.incrementContactRequests();

    res.json({
      success: true,
      message: 'Contact request recorded. You can now reach out to the therapist using their provided contact information.',
      data: {
        contact: therapist.contact
      }
    });

  } catch (error) {
    console.error('Contact therapist error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while processing contact request'
    });
  }
});

// @route   POST /api/therapists/:id/reviews
// @desc    Add a review for a therapist
// @access  Private
router.post('/:id/reviews', auth, [
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  
  body('comment')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Comment must be 500 characters or less'),
  
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

    const { rating, comment, isAnonymous } = req.body;
    const therapist = await Therapist.findById(req.params.id);

    if (!therapist) {
      return res.status(404).json({
        success: false,
        message: 'Therapist not found'
      });
    }

    // Add review
    try {
      await therapist.addReview(req.user.id, rating, comment, isAnonymous);

      res.json({
        success: true,
        message: 'Review added successfully',
        data: {
          averageRating: therapist.ratings.average,
          totalReviews: therapist.ratings.totalReviews
        }
      });
    } catch (reviewError) {
      if (reviewError.message === 'You have already reviewed this therapist') {
        return res.status(400).json({
          success: false,
          message: reviewError.message
        });
      }
      throw reviewError;
    }

  } catch (error) {
    console.error('Add review error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding review'
    });
  }
});

// @route   GET /api/therapists/categories/specialties
// @desc    Get all available specialties
// @access  Public
router.get('/categories/specialties', async (req, res) => {
  try {
    const specialties = [
      'Anxiety & Depression',
      'Trauma & PTSD',
      'Relationship Counseling',
      'Family Therapy',
      'Addiction & Recovery',
      'Grief & Loss',
      'Eating Disorders',
      'ADHD & Learning Disabilities',
      'Bipolar Disorder',
      'OCD',
      'Personality Disorders',
      'Teen & Adolescent Therapy',
      'Child Therapy',
      'Couples Therapy',
      'Group Therapy',
      'Career Counseling',
      'LGBTQ+ Affirmative Therapy',
      'Cultural & Identity Issues',
      'Mindfulness & Meditation',
      'Cognitive Behavioral Therapy',
      'Dialectical Behavior Therapy',
      'EMDR',
      'Psychodynamic Therapy',
      'Humanistic Therapy'
    ];

    // Get counts for each specialty
    const specialtyCounts = await Therapist.aggregate([
      { $match: { status: 'active' } },
      { $unwind: '$specialties' },
      { $group: { _id: '$specialties', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const specialtiesWithCounts = specialties.map(specialty => {
      const countData = specialtyCounts.find(sc => sc._id === specialty);
      return {
        name: specialty,
        count: countData ? countData.count : 0
      };
    });

    res.json({
      success: true,
      data: {
        specialties: specialtiesWithCounts
      }
    });

  } catch (error) {
    console.error('Get specialties error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching specialties'
    });
  }
});

// @route   GET /api/therapists/categories/approaches
// @desc    Get all available therapy approaches
// @access  Public
router.get('/categories/approaches', async (req, res) => {
  try {
    const approaches = [
      'Cognitive Behavioral Therapy (CBT)',
      'Dialectical Behavior Therapy (DBT)',
      'Eye Movement Desensitization and Reprocessing (EMDR)',
      'Acceptance and Commitment Therapy (ACT)',
      'Psychodynamic Therapy',
      'Humanistic/Person-Centered Therapy',
      'Solution-Focused Brief Therapy',
      'Narrative Therapy',
      'Gestalt Therapy',
      'Mindfulness-Based Therapy',
      'Art Therapy',
      'Music Therapy',
      'Play Therapy'
    ];

    // Get counts for each approach
    const approachCounts = await Therapist.aggregate([
      { $match: { status: 'active' } },
      { $unwind: '$approaches' },
      { $group: { _id: '$approaches', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const approachesWithCounts = approaches.map(approach => {
      const countData = approachCounts.find(ac => ac._id === approach);
      return {
        name: approach,
        count: countData ? countData.count : 0
      };
    });

    res.json({
      success: true,
      data: {
        approaches: approachesWithCounts
      }
    });

  } catch (error) {
    console.error('Get approaches error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching approaches'
    });
  }
});

// @route   GET /api/therapists/featured/top-rated
// @desc    Get top-rated therapists
// @access  Public
router.get('/featured/top-rated', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const topRatedTherapists = await Therapist.getTopRated(limit);

    res.json({
      success: true,
      data: {
        therapists: topRatedTherapists
      }
    });

  } catch (error) {
    console.error('Get top-rated therapists error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching top-rated therapists'
    });
  }
});

// @route   GET /api/therapists/search/suggestions
// @desc    Get search suggestions for therapists
// @access  Public
router.get('/search/suggestions', [
  query('q')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Query must be between 1 and 50 characters')
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

    const { q } = req.query;

    // Get suggestions from therapist names, specialties, and cities
    const suggestions = await Therapist.aggregate([
      { $match: { status: 'active' } },
      {
        $project: {
          suggestions: {
            $concatArrays: [
              ['$name'],
              '$specialties',
              ['$location.address.city']
            ]
          }
        }
      },
      { $unwind: '$suggestions' },
      {
        $match: {
          suggestions: { $regex: q, $options: 'i' }
        }
      },
      { $group: { _id: '$suggestions' } },
      { $limit: 10 },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      data: {
        suggestions: suggestions.map(s => s._id)
      }
    });

  } catch (error) {
    console.error('Get search suggestions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching search suggestions'
    });
  }
});

module.exports = router;