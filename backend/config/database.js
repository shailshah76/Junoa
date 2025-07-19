const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/junoa';
    
    console.log('🔌 Connecting to MongoDB...');
    console.log(`📍 URI: ${mongoURI.includes('@') ? 'Atlas' : 'Local'}`);
    
    // Debug: Log connection string (without password)
    const debugURI = mongoURI.replace(/\/\/([^:]+):([^@]+)@/, '//[USERNAME]:[PASSWORD]@');
    console.log(`🔍 Debug URI: ${debugURI}`);
    
    // Enhanced connection options (updated for current MongoDB driver)
    const options = {
      serverSelectionTimeoutMS: 10000, // 10 seconds
      socketTimeoutMS: 45000, // 45 seconds
      maxPoolSize: 10,
      minPoolSize: 1,
      maxIdleTimeMS: 30000, // 30 seconds
      connectTimeoutMS: 10000, // 10 seconds
    };

    const conn = await mongoose.connect(mongoURI, options);
    
    console.log('✅ MongoDB Connected Successfully!');
    console.log(`📊 Host: ${conn.connection.host}`);
    console.log(`🗄️ Database: ${conn.connection.name}`);
    console.log(`🔗 Connection State: Connected`);

    // Connection event listeners
    mongoose.connection.on('connected', () => {
      console.log('🔗 Mongoose connected to MongoDB');
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ Mongoose disconnected from MongoDB');
    });

    // Handle application termination
    process.on('SIGINT', async () => {
      try {
        await mongoose.connection.close();
        console.log('👋 MongoDB connection closed due to application termination');
        process.exit(0);
      } catch (error) {
        console.error('Error closing MongoDB connection:', error);
        process.exit(1);
      }
    });

    return conn;

  } catch (error) {
    console.error('❌ MongoDB Connection Failed:');
    console.error(`Error: ${error.message}`);
    console.error(`Error Code: ${error.code}`);
    console.error(`Error Name: ${error.name}`);
    
    // Detailed error diagnosis
    if (error.message.includes('authentication failed') || error.code === 18) {
      console.log('\n🔧 AUTHENTICATION ISSUE:');
      console.log('1. ✓ Check username/password in MONGODB_URI');
      console.log('2. ✓ Ensure database user exists (Database Access in Atlas)');
      console.log('3. ✓ Verify user has proper permissions');
      console.log('4. ✓ Check if password contains special characters that need URL encoding');
      console.log('5. ✓ Common encodings: @ → %40, # → %23, $ → %24, % → %25');
      
    } else if (error.message.includes('network') || error.message.includes('timeout') || error.code === 'ENOTFOUND') {
      console.log('\n🔧 NETWORK ISSUE:');
      console.log('1. ✓ Check internet connection');
      console.log('2. ✓ Verify IP whitelist in Atlas (Network Access)');
      console.log('3. ✓ Try adding 0.0.0.0/0 to IP whitelist for testing');
      console.log('4. ✓ Check firewall/antivirus settings');
      
    } else if (error.message.includes('MONGODB_URI')) {
      console.log('\n🔧 CONNECTION STRING ISSUE:');
      console.log('1. ✓ Ensure MONGODB_URI is set in .env file');
      console.log('2. ✓ Check connection string format');
      console.log('3. ✓ Verify database name in connection string');
      
    } else if (error.code === 'ECONNREFUSED') {
      console.log('\n🔧 CONNECTION REFUSED:');
      console.log('1. ✓ MongoDB service is not running (if local)');
      console.log('2. ✓ Check port number in connection string');
      console.log('3. ✓ Verify Atlas cluster is running');
    }
    
    // Don't exit in development for easier debugging
    if (process.env.NODE_ENV !== 'development') {
      process.exit(1);
    } else {
      console.log('\n⚠️  Development mode: Not exiting process');
      throw error; // Re-throw for handling by caller
    }
  }
};

// Test connection function
const testConnection = async () => {
  try {
    console.log('🧪 Testing MongoDB connection...');
    
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.db.admin().ping();
      console.log('✅ Connection test successful!');
      return true;
    } else {
      console.log('❌ Not connected to MongoDB');
      return false;
    }
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    return false;
  }
};

// MongoDB health check
const checkDBHealth = async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.db.admin().ping();
      return { 
        status: 'connected', 
        healthy: true, 
        host: mongoose.connection.host,
        database: mongoose.connection.name,
        type: mongoose.connection.host.includes('mongodb.net') ? 'Atlas' : 'Local',
        readyState: mongoose.connection.readyState
      };
    }
    return { 
      status: 'disconnected', 
      healthy: false,
      readyState: mongoose.connection.readyState 
    };
  } catch (error) {
    return { 
      status: 'error', 
      healthy: false, 
      error: error.message,
      readyState: mongoose.connection.readyState 
    };
  }
};

// Create indexes for collections
const createIndexes = async () => {
  try {
    if (mongoose.connection.readyState !== 1) {
      console.log('⚠️ Skipping index creation - MongoDB not connected');
      return;
    }

    console.log('📊 Creating database indexes...');
    
    const db = mongoose.connection.db;
    
    // Create essential indexes with error handling for each
    const indexOperations = [
      { collection: 'users', index: { email: 1 }, options: { unique: true } },
      { collection: 'journalentries', index: { user: 1, createdAt: -1 } },
      { collection: 'communityposts', index: { author: 1, createdAt: -1 } },
      { collection: 'therapists', index: { specialties: 1 } }
    ];

    for (const { collection, index, options = {} } of indexOperations) {
      try {
        await db.collection(collection).createIndex(index, options);
        console.log(`✅ Index created for ${collection}`);
      } catch (error) {
        if (error.code === 11000) {
          console.log(`ℹ️ Index already exists for ${collection}`);
        } else {
          console.log(`⚠️ Index creation warning for ${collection}:`, error.message);
        }
      }
    }
    
    console.log('✅ Database indexes creation completed');
  } catch (error) {
    console.log('⚠️ Index creation error:', error.message);
  }
};

module.exports = {
  connectDB,
  testConnection,
  checkDBHealth,
  createIndexes
};