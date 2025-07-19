# Junoa Backend API

A comprehensive backend API for the Junoa mental health journaling application built with Node.js, Express, and MongoDB.

## Features

- **User Authentication & Authorization** - JWT-based auth with secure password hashing
- **Journal Management** - Create, read, update, delete journal entries with AI responses
- **Community Features** - Share posts, interact with others, moderation system
- **Therapist Directory** - Find and connect with mental health professionals
- **Analytics & Insights** - Personal analytics, mood tracking, writing patterns
- **Data Export** - Export user data in JSON or CSV format
- **Rate Limiting** - Protect against abuse with configurable rate limits
- **Security** - Helmet, CORS, input validation, and more

## Tech Stack

- **Runtime**: Node.js 16+
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT with bcryptjs
- **Validation**: express-validator
- **Security**: Helmet, CORS, rate limiting
- **Testing**: Jest with Supertest
- **Documentation**: Auto-generated API docs

## Project Structure

```
junoa-backend/
├── models/               # Database models
│   ├── User.js          # User model with authentication
│   ├── JournalEntry.js  # Journal entries with AI responses
│   ├── CommunityPost.js # Community posts and interactions
│   └── Therapist.js     # Therapist profiles and reviews
├── routes/              # API route handlers
│   ├── auth.js          # Authentication endpoints
│   ├── journal.js       # Journal management
│   ├── community.js     # Community features
│   ├── therapists.js    # Therapist directory
│   └── profile.js       # User profiles and analytics
├── middleware/          # Custom middleware
│   └── auth.js          # Authentication middleware
├── scripts/             # Utility scripts
│   └── seedDatabase.js  # Database seeding
├── server.js            # Main application entry point
└── package.json         # Dependencies and scripts
```

## Quick Start

### Prerequisites

- Node.js 16.0 or higher
- MongoDB 4.4 or higher
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/junoa/backend.git
   cd junoa-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start MongoDB**
   ```bash
   # Using MongoDB service
   sudo systemctl start mongod
   
   # Or using Docker
   docker run -d -p 27017:27017 --name mongodb mongo:latest
   ```

5. **Seed the database** (optional)
   ```bash
   npm run seed
   ```

6. **Start the server**
   ```bash
   # Development mode with hot reload
   npm run dev
   
   # Production mode
   npm start
   ```

The API will be available at `http://localhost:5000`

## Environment Variables

Create a `.env` file based on `.env.example`:

```bash
# Required
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/junoa
JWT_SECRET=your_super_secure_jwt_secret

# Optional
FRONTEND_URL=http://localhost:3000
EMAIL_HOST=smtp.gmail.com
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
OPENAI_API_KEY=your_openai_api_key
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/change-password` - Change password
- `POST /api/auth/forgot-password` - Password reset request
- `POST /api/auth/reset-password` - Reset password with token

### Journal Management
- `GET /api/journal/entries` - Get user's journal entries
- `POST /api/journal/entries` - Create new journal entry
- `GET /api/journal/entries/:id` - Get specific entry
- `PUT /api/journal/entries/:id` - Update journal entry
- `DELETE /api/journal/entries/:id` - Delete journal entry
- `POST /api/journal/entries/:id/reactions` - Add reaction to entry
- `GET /api/journal/stats` - Get journaling statistics

### Community Features
- `GET /api/community/posts` - Get community posts
- `POST /api/community/posts` - Create community post
- `GET /api/community/posts/:id` - Get specific post
- `POST /api/community/posts/:id/like` - Like/unlike post
- `POST /api/community/posts/:id/comments` - Add comment
- `POST /api/community/posts/:id/bookmark` - Bookmark post
- `GET /api/community/my-posts` - Get user's posts

### Therapist Directory
- `GET /api/therapists` - Search therapists with filters
- `GET /api/therapists/:id` - Get therapist details
- `POST /api/therapists/:id/contact` - Contact therapist
- `POST /api/therapists/:id/reviews` - Add therapist review
- `GET /api/therapists/categories/specialties` - Get specialties

### User Profile & Analytics
- `GET /api/profile/dashboard` - Get dashboard data
- `GET /api/profile/analytics` - Get detailed analytics
- `PUT /api/profile/preferences` - Update preferences
- `GET /api/profile/export` - Export user data
- `GET /api/profile/goals` - Get goals and achievements

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```bash
Authorization: Bearer your_jwt_token_here
```

### Example Login Flow

```javascript
// 1. Register or login
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123'
  })
});

const { data } = await response.json();
const token = data.token;

// 2. Use token for authenticated requests
const journalResponse = await fetch('/api/journal/entries', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

## Database Models

### User Model
- Personal information and preferences
- Authentication data (hashed passwords)
- Statistics and achievements
- Email verification and password reset tokens

### Journal Entry Model
- Rich content with mood tracking
- AI-generated responses and insights
- Tags, emotions, and metadata
- Privacy settings and community sharing

### Community Post Model
- Titles, content, and categories
- Engagement metrics (likes, comments, views)
- Moderation and reporting system
- Anonymous posting support

### Therapist Model
- Professional credentials and specialties
- Location and availability information
- Pricing and insurance details
- Reviews and ratings system

## Rate Limiting

The API implements rate limiting to prevent abuse:

- **General API**: 100 requests per 15 minutes
- **Authentication**: 5 requests per 15 minutes
- **Journal Creation**: 10 entries per hour
- **Community Interactions**: 30 per minute

## Security Features

- **Password Hashing**: bcryptjs with salt rounds
- **JWT Tokens**: Secure token-based authentication
- **Input Validation**: Comprehensive request validation
- **Rate Limiting**: Prevent API abuse
- **CORS**: Configurable cross-origin requests
- **Helmet**: Security headers
- **NoSQL Injection**: Mongoose schema validation

## Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## Development Scripts

```bash
npm run dev          # Start with nodemon (hot reload)
npm run seed         # Populate database with sample data
npm run lint         # Run ESLint
npm run lint:fix     # Fix linting issues automatically
```

## API Response Format

All API responses follow this consistent format:

```javascript
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    // Response data here
  },
  "pagination": {  // For paginated responses
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 100,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

Error responses:
```javascript
{
  "success": false,
  "message": "Error description",
  "errors": [  // Validation errors
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

## Deployment

### Docker Deployment

```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

### Environment-specific Configuration

**Development**:
- Enable detailed logging
- Mock external services
- Auto-restart on changes

**Production**:
- Optimize performance
- Enable monitoring
- Secure error handling

## Monitoring & Logging

The application includes comprehensive logging:

- **Request Logging**: Morgan middleware
- **Error Logging**: Winston with MongoDB transport
- **Performance Metrics**: Response times and memory usage
- **Health Checks**: `/api/health` endpoint

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- Use ESLint configuration
- Follow RESTful API conventions
- Add tests for new features
- Update documentation

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For questions or support:
- Create an issue on GitHub
- Email: support@junoa.com
- Documentation: [API Documentation](https://docs.junoa.com)

## Changelog

### v1.0.0
- Initial release
- User authentication system
- Journal entry management
- Community features
- Therapist directory
- Analytics and insights

---

Built with ❤️ for mental health and well-being.