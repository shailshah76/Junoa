const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const app = require('../server');
const User = require('../models/User');

let mongoServer;

// Setup in-memory MongoDB for testing
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

// Clean up after tests
afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

// Clear database before each test
beforeEach(async () => {
  await User.deleteMany({});
});

describe('Authentication Endpoints', () => {
  describe('POST /api/auth/signup', () => {
    const validUserData = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'Password123',
      confirmPassword: 'Password123'
    };

    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send(validUserData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User registered successfully');
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.email).toBe(validUserData.email);
      expect(response.body.data.user.name).toBe(validUserData.name);

      // Verify user was created in database
      const user = await User.findOne({ email: validUserData.email });
      expect(user).toBeTruthy();
      expect(user.name).toBe(validUserData.name);
    });

    it('should reject signup with invalid email', async () => {
      const invalidData = { ...validUserData, email: 'invalid-email' };
      
      const response = await request(app)
        .post('/api/auth/signup')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
      expect(response.body.errors).toBeDefined();
    });

    it('should reject signup with short password', async () => {
      const invalidData = { ...validUserData, password: '123', confirmPassword: '123' };
      
      const response = await request(app)
        .post('/api/auth/signup')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should reject signup with mismatched passwords', async () => {
      const invalidData = { 
        ...validUserData, 
        password: 'Password123', 
        confirmPassword: 'DifferentPassword123' 
      };
      
      const response = await request(app)
        .post('/api/auth/signup')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject signup with duplicate email', async () => {
      // Create user first
      await request(app)
        .post('/api/auth/signup')
        .send(validUserData);

      // Try to create another user with same email
      const response = await request(app)
        .post('/api/auth/signup')
        .send(validUserData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User with this email already exists');
    });

    it('should reject signup with missing required fields', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({ email: 'test@example.com' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create a test user before each login test
      await request(app)
        .post('/api/auth/signup')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'Password123',
          confirmPassword: 'Password123'
        });
    });

    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Password123'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Login successful');
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.email).toBe('test@example.com');
    });

    it('should reject login with invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Password123'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid email or password');
    });

    it('should reject login with invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'WrongPassword'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid email or password');
    });

    it('should reject login with malformed email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'invalid-email',
          password: 'Password123'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should reject login with missing credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });
  });

  describe('GET /api/auth/profile', () => {
    let authToken;
    let userId;

    beforeEach(async () => {
      // Create and login a user to get auth token
      const signupResponse = await request(app)
        .post('/api/auth/signup')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'Password123',
          confirmPassword: 'Password123'
        });

      authToken = signupResponse.body.data.token;
      userId = signupResponse.body.data.user.id;
    });

    it('should get user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.id).toBe(userId);
      expect(response.body.data.user.email).toBe('test@example.com');
      expect(response.body.data.user.name).toBe('Test User');
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access denied. No token provided.');
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access denied. Invalid token.');
    });

    it('should reject request with malformed authorization header', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'InvalidFormat token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access denied. Invalid token format.');
    });
  });

  describe('PUT /api/auth/profile', () => {
    let authToken;

    beforeEach(async () => {
      const signupResponse = await request(app)
        .post('/api/auth/signup')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'Password123',
          confirmPassword: 'Password123'
        });

      authToken = signupResponse.body.data.token;
    });

    it('should update user profile successfully', async () => {
      const updateData = {
        name: 'Updated Name',
        preferences: {
          emailNotifications: false,
          dailyReminders: true
        }
      };

      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Profile updated successfully');
      expect(response.body.data.user.name).toBe('Updated Name');
      expect(response.body.data.user.preferences.emailNotifications).toBe(false);
    });

    it('should reject update with invalid email format', async () => {
      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ email: 'invalid-email' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should reject update without authentication', async () => {
      const response = await request(app)
        .put('/api/auth/profile')
        .send({ name: 'New Name' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/change-password', () => {
    let authToken;

    beforeEach(async () => {
      const signupResponse = await request(app)
        .post('/api/auth/signup')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'Password123',
          confirmPassword: 'Password123'
        });

      authToken = signupResponse.body.data.token;
    });

    it('should change password successfully', async () => {
      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: 'Password123',
          newPassword: 'NewPassword123',
          confirmPassword: 'NewPassword123'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Password changed successfully');

      // Verify login works with new password
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'NewPassword123'
        })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);
    });

    it('should reject password change with wrong current password', async () => {
      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: 'WrongPassword',
          newPassword: 'NewPassword123',
          confirmPassword: 'NewPassword123'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Current password is incorrect');
    });

    it('should reject password change with weak new password', async () => {
      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: 'Password123',
          newPassword: '123',
          confirmPassword: '123'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });
  });
});

describe('Rate Limiting', () => {
  it('should rate limit authentication requests', async () => {
    const promises = [];
    
    // Make 6 rapid login attempts (limit is 5)
    for (let i = 0; i < 6; i++) {
      promises.push(
        request(app)
          .post('/api/auth/login')
          .send({
            email: 'test@example.com',
            password: 'password'
          })
      );
    }

    const responses = await Promise.all(promises);
    
    // Last request should be rate limited
    const lastResponse = responses[responses.length - 1];
    expect(lastResponse.status).toBe(429);
    expect(lastResponse.body.message).toContain('Too many');
  }, 10000); // Increase timeout for this test
});

describe('Error Handling', () => {
  it('should handle 404 for non-existent endpoints', async () => {
    const response = await request(app)
      .get('/api/non-existent-endpoint')
      .expect(404);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Route not found');
  });

  it('should handle malformed JSON gracefully', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{ invalid json }')
      .expect(400);

    expect(response.body.success).toBe(false);
  });
});