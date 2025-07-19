#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Setting up Junoa Backend...\n');

// Check Node.js version
const nodeVersion = process.version;
const requiredVersion = 'v16.0.0';

console.log(`📋 Checking Node.js version: ${nodeVersion}`);
if (nodeVersion < requiredVersion) {
  console.error(`❌ Node.js ${requiredVersion} or higher is required`);
  process.exit(1);
}
console.log('✅ Node.js version is compatible\n');

// Create necessary directories
const directories = [
  'uploads',
  'uploads/avatars',
  'uploads/attachments',
  'uploads/temp',
  'logs',
  'temp',
  'coverage',
  'docs/api'
];

console.log('📁 Creating directories...');
directories.forEach(dir => {
  const fullPath = path.join(process.cwd(), dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    console.log(`   Created: ${dir}/`);
  } else {
    console.log(`   Exists:  ${dir}/`);
  }
});
console.log('✅ Directories created\n');

// Create .env file if it doesn't exist
console.log('⚙️  Setting up environment configuration...');
const envPath = path.join(process.cwd(), '.env');
const envExamplePath = path.join(process.cwd(), '.env.example');

if (!fs.existsSync(envPath)) {
  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
    console.log('✅ Created .env file from .env.example');
    console.log('⚠️  Please update .env with your actual configuration values');
  } else {
    console.log('⚠️  .env.example not found, creating basic .env file...');
    const basicEnv = `NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/junoa
JWT_SECRET=your_super_secure_jwt_secret_key_here
FRONTEND_URL=http://localhost:3000
`;
    fs.writeFileSync(envPath, basicEnv);
    console.log('✅ Created basic .env file');
  }
} else {
  console.log('✅ .env file already exists');
}
console.log('');

// Install dependencies
console.log('📦 Installing dependencies...');
try {
  execSync('npm install', { stdio: 'inherit' });
  console.log('✅ Dependencies installed successfully\n');
} catch (error) {
  console.error('❌ Failed to install dependencies');
  console.error(error.message);
  process.exit(1);
}

// Check if MongoDB is running
console.log('🗄️  Checking MongoDB connection...');
try {
  const mongoose = require('mongoose');
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/junoa';
  
  mongoose.connect(mongoUri, { 
    useNewUrlParser: true, 
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000
  });
  
  mongoose.connection.on('connected', () => {
    console.log('✅ MongoDB connection successful');
    mongoose.connection.close();
    setupComplete();
  });
  
  mongoose.connection.on('error', (error) => {
    console.log('⚠️  MongoDB connection failed:', error.message);
    console.log('ℹ️  Make sure MongoDB is running or update MONGODB_URI in .env');
    mongoose.connection.close();
    setupComplete();
  });
  
} catch (error) {
  console.log('⚠️  Could not test MongoDB connection:', error.message);
  setupComplete();
}

function setupComplete() {
  console.log('\n🎉 Setup completed!\n');
  
  console.log('📋 Next steps:');
  console.log('   1. Update .env file with your configuration');
  console.log('   2. Make sure MongoDB is running');
  console.log('   3. Run: npm run seed (optional - adds sample data)');
  console.log('   4. Run: npm run dev (start development server)');
  console.log('   5. Visit: http://localhost:5000/health\n');
  
  console.log('🔧 Available scripts:');
  console.log('   npm run dev      - Start development server with hot reload');
  console.log('   npm start        - Start production server');
  console.log('   npm run seed     - Populate database with sample data');
  console.log('   npm test         - Run test suite');
  console.log('   npm run lint     - Check code style');
  console.log('   npm run lint:fix - Fix code style issues\n');
  
  console.log('📚 Documentation:');
  console.log('   Health Check:    http://localhost:5000/health');
  console.log('   API Reference:   http://localhost:5000/api');
  console.log('   Project README:  ./README.md\n');
  
  console.log('✨ Happy coding!\n');
}

// Handle script interruption
process.on('SIGINT', () => {
  console.log('\n\n⚠️  Setup interrupted by user');
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('\n\n⚠️  Setup terminated');
  process.exit(1);
});