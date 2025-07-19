const mongoose = require('mongoose');

const therapistSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  title: {
    type: String,
    required: [true, 'Professional title is required'],
    enum: ['Dr.', 'Ms.', 'Mr.', 'Prof.', 'LCSW', 'LMFT', 'PhD', 'PsyD', 'MD']
  },
  credentials: [{
    type: String,
    trim: true
  }],
  licenseNumber: {
    type: String,
    required: [true, 'License number is required'],
    unique: true
  },
  specialties: [{
    type: String,
    required: true,
    enum: [
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
    ]
  }],
  approaches: [{
    type: String,
    enum: [
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
    ]
  }],
  bio: {
    type: String,
    maxlength: [1000, 'Bio cannot exceed 1000 characters']
  },
  experience: {
    years: {
      type: Number,
      min: [0, 'Years of experience cannot be negative'],
      max: [50, 'Years of experience seems too high']
    },
    description: String
  },
  education: [{
    degree: {
      type: String,
      required: true
    },
    institution: {
      type: String,
      required: true
    },
    year: {
      type: Number,
      min: 1950,
      max: new Date().getFullYear()
    }
  }],
  contact: {
    phone: {
      type: String,
      match: [/^\+?[\d\s\-\(\)]+$/, 'Please enter a valid phone number']
    },
    email: {
      type: String,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please enter a valid email address'
      ]
    },
    website: {
      type: String,
      match: [/^https?:\/\/.+/, 'Please enter a valid website URL']
    }
  },
  location: {
    address: {
      street: String,
      city: {
        type: String,
        required: [true, 'City is required']
      },
      state: {
        type: String,
        required: [true, 'State is required']
      },
      zipCode: {
        type: String,
        match: [/^\d{5}(-\d{4})?$/, 'Please enter a valid ZIP code']
      },
      country: {
        type: String,
        default: 'United States'
      }
    },
    coordinates: {
      latitude: {
        type: Number,
        min: -90,
        max: 90
      },
      longitude: {
        type: Number,
        min: -180,
        max: 180
      }
    }
  },
  services: {
    individual: {
      type: Boolean,
      default: true
    },
    couples: {
      type: Boolean,
      default: false
    },
    family: {
      type: Boolean,
      default: false
    },
    group: {
      type: Boolean,
      default: false
    },
    online: {
      type: Boolean,
      default: false
    },
    inPerson: {
      type: Boolean,
      default: true
    }
  },
  availability: {
    schedule: [{
      day: {
        type: String,
        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
      },
      startTime: String,
      endTime: String,
      available: {
        type: Boolean,
        default: true
      }
    }],
    timezone: {
      type: String,
      default: 'America/New_York'
    },
    nextAvailable: Date,
    waitingList: {
      type: Boolean,
      default: false
    }
  },
  pricing: {
    individualSession: {
      min: Number,
      max: Number
    },
    couplesSession: {
      min: Number,
      max: Number
    },
    groupSession: {
      min: Number,
      max: Number
    },
    acceptsInsurance: {
      type: Boolean,
      default: false
    },
    insuranceProviders: [String],
    slidingScale: {
      type: Boolean,
      default: false
    }
  },
  ratings: {
    average: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },
    totalReviews: {
      type: Number,
      default: 0
    }
  },
  reviews: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      maxlength: 500
    },
    isAnonymous: {
      type: Boolean,
      default: true
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  profileImage: {
    url: String,
    publicId: String
  },
  verified: {
    isVerified: {
      type: Boolean,
      default: false
    },
    verifiedAt: Date,
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'pending'],
    default: 'pending'
  },
  preferences: {
    acceptNewClients: {
      type: Boolean,
      default: true
    },
    emergencyContact: {
      type: Boolean,
      default: false
    },
    languages: [{
      type: String,
      default: ['English']
    }],
    ageGroups: [{
      type: String,
      enum: ['Children (5-12)', 'Teens (13-17)', 'Adults (18-64)', 'Seniors (65+)']
    }]
  },
  analytics: {
    profileViews: {
      type: Number,
      default: 0
    },
    contactRequests: {
      type: Number,
      default: 0
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
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
therapistSchema.index({ 'location.coordinates': '2dsphere' });
therapistSchema.index({ specialties: 1 });
therapistSchema.index({ 'location.address.city': 1, 'location.address.state': 1 });
therapistSchema.index({ 'ratings.average': -1 });
therapistSchema.index({ status: 1, 'preferences.acceptNewClients': 1 });

// Virtual for full name
therapistSchema.virtual('fullName').get(function() {
  return `${this.title} ${this.name}`;
});

// Virtual for formatted address
therapistSchema.virtual('formattedAddress').get(function() {
  const addr = this.location.address;
  return `${addr.city}, ${addr.state} ${addr.zipCode}`;
});

// Virtual for distance (will be calculated in queries)
therapistSchema.virtual('distance');

// Pre-save middleware
therapistSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Instance method to add review
therapistSchema.methods.addReview = async function(userId, rating, comment, isAnonymous = true) {
  // Check if user already reviewed
  const existingReview = this.reviews.find(review => 
    review.user && review.user.equals(userId)
  );
  
  if (existingReview) {
    throw new Error('You have already reviewed this therapist');
  }
  
  this.reviews.push({
    user: userId,
    rating: rating,
    comment: comment,
    isAnonymous: isAnonymous
  });
  
  // Recalculate average rating
  this.calculateAverageRating();
  
  await this.save();
  return this;
};

// Instance method to calculate average rating
therapistSchema.methods.calculateAverageRating = function() {
  if (this.reviews.length === 0) {
    this.ratings.average = 0;
    this.ratings.totalReviews = 0;
    return;
  }
  
  const sum = this.reviews.reduce((total, review) => total + review.rating, 0);
  this.ratings.average = Math.round((sum / this.reviews.length) * 10) / 10;
  this.ratings.totalReviews = this.reviews.length;
};

// Instance method to increment profile views
therapistSchema.methods.incrementProfileViews = async function() {
  this.analytics.profileViews += 1;
  await this.save();
};

// Instance method to increment contact requests
therapistSchema.methods.incrementContactRequests = async function() {
  this.analytics.contactRequests += 1;
  await this.save();
};

// Static method to find therapists by location
therapistSchema.statics.findByLocation = function(latitude, longitude, maxDistance = 25, options = {}) {
  const {
    specialties,
    minRating = 0,
    acceptsInsurance,
    acceptNewClients = true,
    limit = 20
  } = options;
  
  let query = {
    status: 'active',
    'preferences.acceptNewClients': acceptNewClients,
    'location.coordinates': {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        $maxDistance: maxDistance * 1609.34 // Convert miles to meters
      }
    }
  };
  
  if (specialties && specialties.length > 0) {
    query.specialties = { $in: specialties };
  }
  
  if (minRating > 0) {
    query['ratings.average'] = { $gte: minRating };
  }
  
  if (acceptsInsurance !== undefined) {
    query['pricing.acceptsInsurance'] = acceptsInsurance;
  }
  
  return this.find(query)
    .limit(limit)
    .sort({ 'ratings.average': -1, 'ratings.totalReviews': -1 });
};

// Static method to search therapists
therapistSchema.statics.searchTherapists = function(searchTerm, options = {}) {
  const { limit = 20, skip = 0 } = options;
  
  return this.find({
    $and: [
      {
        $or: [
          { name: { $regex: searchTerm, $options: 'i' } },
          { specialties: { $in: [new RegExp(searchTerm, 'i')] } },
          { approaches: { $in: [new RegExp(searchTerm, 'i')] } },
          { 'location.address.city': { $regex: searchTerm, $options: 'i' } }
        ]
      },
      { status: 'active' }
    ]
  })
  .sort({ 'ratings.average': -1 })
  .skip(skip)
  .limit(limit);
};

// Static method to get top rated therapists
therapistSchema.statics.getTopRated = function(limit = 10) {
  return this.find({ 
    status: 'active',
    'ratings.totalReviews': { $gte: 5 }
  })
  .sort({ 'ratings.average': -1, 'ratings.totalReviews': -1 })
  .limit(limit);
};

module.exports = mongoose.model('Therapist', therapistSchema);