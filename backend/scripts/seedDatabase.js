const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('../models/User');
const JournalEntry = require('../models/JournalEntry');
const CommunityPost = require('../models/CommunityPost');
const Therapist = require('../models/Therapist');

// Sample data
const sampleUsers = [
  {
    name: 'Alice Johnson',
    email: 'alice@example.com',
    password: 'password123',
    preferences: {
      emailNotifications: true,
      dailyReminders: true,
      communityUpdates: false,
      darkMode: true
    }
  },
  {
    name: 'Bob Smith',
    email: 'bob@example.com',
    password: 'password123',
    preferences: {
      emailNotifications: false,
      dailyReminders: true,
      communityUpdates: true,
      darkMode: false
    }
  },
  {
    name: 'Carol Davis',
    email: 'carol@example.com',
    password: 'password123'
  }
];

const sampleTherapists = [
  {
    name: 'Sarah Martinez',
    title: 'Dr.',
    credentials: ['PhD', 'Licensed Clinical Psychologist'],
    licenseNumber: 'PSY123456',
    specialties: ['Anxiety & Depression', 'Trauma & PTSD', 'Cognitive Behavioral Therapy'],
    approaches: ['Cognitive Behavioral Therapy (CBT)', 'EMDR', 'Mindfulness-Based Therapy'],
    bio: 'Dr. Sarah Martinez is a licensed clinical psychologist with over 10 years of experience helping individuals overcome anxiety, depression, and trauma. She specializes in evidence-based treatments and creates a warm, supportive environment for healing.',
    experience: {
      years: 10,
      description: 'Specialized in anxiety disorders and trauma recovery with extensive training in EMDR and CBT techniques.'
    },
    education: [
      {
        degree: 'PhD in Clinical Psychology',
        institution: 'University of California, Los Angeles',
        year: 2014
      },
      {
        degree: 'MA in Psychology',
        institution: 'Stanford University',
        year: 2011
      }
    ],
    contact: {
      phone: '+1-555-0123',
      email: 'dr.martinez@therapyservices.com',
      website: 'https://drmartineztherapy.com'
    },
    location: {
      address: {
        street: '123 Therapy Lane',
        city: 'Boston',
        state: 'MA',
        zipCode: '02101',
        country: 'United States'
      },
      coordinates: {
        latitude: 42.3601,
        longitude: -71.0589
      }
    },
    services: {
      individual: true,
      couples: true,
      family: false,
      group: true,
      online: true,
      inPerson: true
    },
    availability: {
      schedule: [
        { day: 'Monday', startTime: '09:00', endTime: '17:00', available: true },
        { day: 'Tuesday', startTime: '09:00', endTime: '17:00', available: true },
        { day: 'Wednesday', startTime: '09:00', endTime: '17:00', available: true },
        { day: 'Thursday', startTime: '09:00', endTime: '17:00', available: true },
        { day: 'Friday', startTime: '09:00', endTime: '15:00', available: true }
      ],
      nextAvailable: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days from now
    },
    pricing: {
      individualSession: { min: 120, max: 150 },
      couplesSession: { min: 160, max: 200 },
      groupSession: { min: 80, max: 100 },
      acceptsInsurance: true,
      insuranceProviders: ['Blue Cross Blue Shield', 'Aetna', 'Cigna'],
      slidingScale: true
    },
    ratings: {
      average: 4.9,
      totalReviews: 47
    },
    status: 'active',
    verified: {
      isVerified: true,
      verifiedAt: new Date()
    },
    preferences: {
      acceptNewClients: true,
      emergencyContact: false,
      languages: ['English', 'Spanish'],
      ageGroups: ['Adults (18-64)', 'Seniors (65+)']
    }
  },
  {
    name: 'Michael Chen',
    title: 'Dr.',
    credentials: ['MD', 'Board Certified Psychiatrist'],
    licenseNumber: 'MD789012',
    specialties: ['Trauma & PTSD', 'Bipolar Disorder', 'ADHD & Learning Disabilities'],
    approaches: ['Psychodynamic Therapy', 'Dialectical Behavior Therapy (DBT)', 'Medication Management'],
    bio: 'Dr. Michael Chen is a board-certified psychiatrist specializing in trauma recovery and mood disorders. He combines medication management with therapy to provide comprehensive care.',
    experience: {
      years: 15,
      description: 'Extensive experience in treating complex trauma and mood disorders in both inpatient and outpatient settings.'
    },
    education: [
      {
        degree: 'MD',
        institution: 'Harvard Medical School',
        year: 2009
      },
      {
        degree: 'BS in Neuroscience',
        institution: 'MIT',
        year: 2005
      }
    ],
    contact: {
      phone: '+1-555-0456',
      email: 'dr.chen@mindwellcenter.com'
    },
    location: {
      address: {
        street: '456 Mental Health Ave',
        city: 'Boston',
        state: 'MA',
        zipCode: '02102',
        country: 'United States'
      },
      coordinates: {
        latitude: 42.3505,
        longitude: -71.0621
      }
    },
    services: {
      individual: true,
      couples: false,
      family: true,
      group: false,
      online: true,
      inPerson: true
    },
    pricing: {
      individualSession: { min: 200, max: 250 },
      acceptsInsurance: true,
      insuranceProviders: ['Harvard Pilgrim', 'Tufts Health Plan', 'Blue Cross Blue Shield']
    },
    ratings: {
      average: 4.8,
      totalReviews: 32
    },
    status: 'active',
    verified: {
      isVerified: true,
      verifiedAt: new Date()
    }
  },
  {
    name: 'Emily Rodriguez',
    title: 'LMFT',
    credentials: ['LMFT', 'Certified Couples Therapist'],
    licenseNumber: 'LMFT345678',
    specialties: ['Relationship Counseling', 'Family Therapy', 'LGBTQ+ Affirmative Therapy'],
    approaches: ['Emotionally Focused Therapy', 'Gottman Method', 'Narrative Therapy'],
    bio: 'Emily Rodriguez is a licensed marriage and family therapist who helps couples and families build stronger, healthier relationships. She is passionate about creating inclusive spaces for all clients.',
    experience: {
      years: 8,
      description: 'Specialized training in couples therapy and LGBTQ+ affirmative practices.'
    },
    education: [
      {
        degree: 'MA in Marriage and Family Therapy',
        institution: 'Boston University',
        year: 2016
      }
    ],
    contact: {
      phone: '+1-555-0789',
      email: 'emily@relationshipsthrive.com',
      website: 'https://relationshipsthrive.com'
    },
    location: {
      address: {
        street: '789 Relationship Way',
        city: 'Cambridge',
        state: 'MA',
        zipCode: '02139',
        country: 'United States'
      },
      coordinates: {
        latitude: 42.3736,
        longitude: -71.1097
      }
    },
    services: {
      individual: true,
      couples: true,
      family: true,
      group: false,
      online: true,
      inPerson: true
    },
    pricing: {
      individualSession: { min: 100, max: 130 },
      couplesSession: { min: 140, max: 170 },
      acceptsInsurance: false,
      slidingScale: true
    },
    ratings: {
      average: 4.7,
      totalReviews: 28
    },
    status: 'active',
    verified: {
      isVerified: true,
      verifiedAt: new Date()
    },
    preferences: {
      acceptNewClients: true,
      languages: ['English', 'Spanish'],
      ageGroups: ['Teens (13-17)', 'Adults (18-64)']
    }
  }
];

const sampleCommunityPosts = [
  {
    title: 'Finding Light in Dark Times',
    content: 'I wanted to share something that helped me through a really tough period in my life. About six months ago, I was struggling with severe anxiety and felt like I was drowning. Every day felt like a mountain to climb, and I couldn\'t see any way forward.\n\nWhat helped me was starting small. Instead of trying to fix everything at once, I focused on just one thing each day that would make me feel slightly better. Sometimes it was as simple as making my bed or taking a five-minute walk outside.\n\nSlowly, these small actions built up into bigger changes. I started therapy, began journaling regularly, and reconnected with friends I had been avoiding. It wasn\'t linear - there were setbacks and difficult days - but gradually, the light started coming back.\n\nIf you\'re going through a dark time right now, please know that you\'re not alone. Small steps count, and it\'s okay to take things one day at a time. You\'re stronger than you know.',
    category: 'inspiration',
    tags: ['anxiety', 'recovery', 'hope', 'small-steps'],
    mood: 'hopeful'
  },
  {
    title: 'Small Victories Matter',
    content: 'Today I managed to get out of bed, shower, and make breakfast. It might seem small to some people, but for me, it\'s huge. I\'ve been dealing with depression for the past few months, and there were days when even these basic tasks felt impossible.\n\nI\'m learning to celebrate these small victories instead of dismissing them. My therapist told me that recovery isn\'t about giant leaps - it\'s about consistent small steps forward. Some days the step is tiny, and that\'s okay.\n\nTo anyone else struggling with mental health challenges: your small victories matter too. Whether it\'s getting dressed, calling a friend, or just surviving a difficult day - give yourself credit. You\'re doing better than you think.',
    category: 'milestone',
    tags: ['depression', 'small-victories', 'self-care', 'progress'],
    mood: 'grateful'
  },
  {
    title: 'Gratitude Practice Changed My Life',
    content: 'Three months ago, I started writing down three things I was grateful for each day. I was skeptical at first - it seemed too simple to make a real difference. But I was wrong.\n\nAt first, I struggled to find things to write. I started with basics: "I have a roof over my head," "I had food to eat today," "I\'m healthy." But as weeks went by, I began noticing smaller, more specific things: the way sunlight hit my window in the morning, a kind text from a friend, the taste of my coffee.\n\nThis practice has shifted my entire perspective. I still have difficult days, but I\'m much more aware of the good things in my life. It\'s like I\'ve trained my brain to look for positives instead of automatically focusing on what\'s wrong.\n\nIf you\'re looking for a simple practice to improve your mental health, I can\'t recommend gratitude journaling enough. Start small - even one thing per day can make a difference.',
    category: 'advice',
    tags: ['gratitude', 'journaling', 'mindfulness', 'positivity'],
    mood: 'positive'
  }
];

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/junoa', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

const clearDatabase = async () => {
  try {
    await User.deleteMany({});
    await JournalEntry.deleteMany({});
    await CommunityPost.deleteMany({});
    await Therapist.deleteMany({});
    console.log('Database cleared');
  } catch (error) {
    console.error('Error clearing database:', error);
  }
};

const seedUsers = async () => {
  try {
    const users = [];
    
    for (const userData of sampleUsers) {
      const user = new User({
        ...userData,
        emailVerified: true,
        stats: {
          journalEntriesCount: Math.floor(Math.random() * 50) + 5,
          daysActive: Math.floor(Math.random() * 90) + 10,
          insightsGained: Math.floor(Math.random() * 25) + 5,
          streak: Math.floor(Math.random() * 15),
          lastActiveDate: new Date()
        }
      });
      
      await user.save();
      users.push(user);
    }
    
    console.log(`Created ${users.length} users`);
    return users;
  } catch (error) {
    console.error('Error seeding users:', error);
    return [];
  }
};

const seedTherapists = async () => {
  try {
    const therapists = [];
    
    for (const therapistData of sampleTherapists) {
      // Add some sample reviews
      const reviews = [
        {
          rating: 5,
          comment: 'Excellent therapist, very professional and caring.',
          isAnonymous: true,
          isVerified: true,
          createdAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000)
        },
        {
          rating: 5,
          comment: 'Really helped me work through my anxiety. Highly recommend.',
          isAnonymous: true,
          isVerified: true,
          createdAt: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000)
        },
        {
          rating: 4,
          comment: 'Great approach, though scheduling can be challenging.',
          isAnonymous: true,
          isVerified: true,
          createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
        }
      ];
      
      const therapist = new Therapist({
        ...therapistData,
        reviews,
        analytics: {
          profileViews: Math.floor(Math.random() * 500) + 50,
          contactRequests: Math.floor(Math.random() * 25) + 5
        }
      });
      
      // Calculate average rating
      therapist.calculateAverageRating();
      
      await therapist.save();
      therapists.push(therapist);
    }
    
    console.log(`Created ${therapists.length} therapists`);
    return therapists;
  } catch (error) {
    console.error('Error seeding therapists:', error);
    return [];
  }
};

const seedJournalEntries = async (users) => {
  try {
    const entries = [];
    const moods = ['calm', 'reflective', 'peaceful', 'anxious', 'sad', 'happy', 'grateful'];
    
    for (const user of users) {
      const numEntries = Math.floor(Math.random() * 10) + 5;
      
      for (let i = 0; i < numEntries; i++) {
        const content = `This is a sample journal entry for ${user.name}. Today I'm feeling ${moods[Math.floor(Math.random() * moods.length)]} and wanted to reflect on my thoughts and experiences. Writing helps me process my emotions and gain clarity about what's happening in my life.`;
        
        const entry = new JournalEntry({
          user: user._id,
          content,
          mood: moods[Math.floor(Math.random() * moods.length)],
          tags: ['sample', 'reflection'],
          createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date within last 30 days
          aiResponse: {
            content: "Thank you for sharing your thoughts. It's wonderful that you're taking time to reflect and process your emotions through writing. This self-awareness is a powerful tool for personal growth.",
            sentiment: 'positive',
            suggestions: ['Continue this reflective practice', 'Consider exploring what triggered these feelings'],
            confidence: 0.8
          }
        });
        
        await entry.save();
        entries.push(entry);
      }
    }
    
    console.log(`Created ${entries.length} journal entries`);
    return entries;
  } catch (error) {
    console.error('Error seeding journal entries:', error);
    return [];
  }
};

const seedCommunityPosts = async (users) => {
  try {
    const posts = [];
    
    for (let i = 0; i < sampleCommunityPosts.length; i++) {
      const postData = sampleCommunityPosts[i];
      const randomUser = users[Math.floor(Math.random() * users.length)];
      
      const post = new CommunityPost({
        ...postData,
        author: randomUser._id,
        isAnonymous: Math.random() > 0.7, // 30% chance of being anonymous
        createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random date within last week
        likes: [], // Will be populated separately
        comments: [],
        engagement: {
          views: Math.floor(Math.random() * 100) + 20,
          uniqueViewers: []
        }
      });
      
      await post.save();
      posts.push(post);
    }
    
    // Add some likes and comments
    for (const post of posts) {
      // Add random likes
      const numLikes = Math.floor(Math.random() * 25) + 5;
      const likedUsers = users.slice(0, numLikes);
      
      for (const user of likedUsers) {
        await post.addLike(user._id);
      }
      
      // Add random comments
      const numComments = Math.floor(Math.random() * 8) + 2;
      const commentTexts = [
        "Thank you for sharing this. It really resonates with me.",
        "This is so helpful and inspiring!",
        "I needed to read this today. Thank you.",
        "Your strength is amazing. Keep going!",
        "This gives me hope. Thank you for being vulnerable.",
        "I'm going through something similar. You're not alone.",
        "Beautiful words. Thank you for the reminder.",
        "This perspective is exactly what I needed."
      ];
      
      for (let i = 0; i < numComments; i++) {
        const randomUser = users[Math.floor(Math.random() * users.length)];
        const randomComment = commentTexts[Math.floor(Math.random() * commentTexts.length)];
        await post.addComment(randomUser._id, randomComment, Math.random() > 0.8);
      }
    }
    
    console.log(`Created ${posts.length} community posts`);
    return posts;
  } catch (error) {
    console.error('Error seeding community posts:', error);
    return [];
  }
};

const seedDatabase = async () => {
  console.log('Starting database seeding...');
  
  await connectDB();
  await clearDatabase();
  
  const users = await seedUsers();
  const therapists = await seedTherapists();
  const journalEntries = await seedJournalEntries(users);
  const communityPosts = await seedCommunityPosts(users);
  
  console.log('\nSeeding completed successfully!');
  console.log(`Total created: ${users.length} users, ${therapists.length} therapists, ${journalEntries.length} journal entries, ${communityPosts.length} community posts`);
  
  mongoose.connection.close();
};

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase().catch(error => {
    console.error('Seeding failed:', error);
    process.exit(1);
  });
}

module.exports = {
  seedDatabase,
  clearDatabase,
  seedUsers,
  seedTherapists,
  seedJournalEntries,
  seedCommunityPosts
};