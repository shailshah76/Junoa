# Junoa - Mental Health Journaling App

A full-stack mental health journaling application with AI-powered insights, community support, and therapist connections.

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd Junoa
   npm run install:all
   ```

2. **Set up environment variables:**
   
   Create `.env` file in the `backend` directory:
   ```env
   MONGODB_URI=mongodb://localhost:27017/junoa
   JWT_SECRET=your-secret-key-here
   PORT=5000
   NODE_ENV=development
   ```
   
   Create `.env` file in the `junoa-app` directory:
   ```env
   VITE_API_URL=http://localhost:5000
   ```

3. **Start MongoDB (if using local):**
   ```bash
   brew services start mongodb-community
   ```

4. **Seed the database (optional):**
   ```bash
   npm run seed
   ```

5. **Run both applications:**
   ```bash
   npm run dev
   ```

This will start:
- **Backend**: http://localhost:7451
- **Frontend**: http://localhost:5173

## 📁 Project Structure

```
Junoa/
├── backend/                 # Express.js API server
│   ├── config/             # Database and app configuration
│   ├── middleware/         # Authentication and validation
│   ├── models/            # MongoDB schemas
│   ├── routes/            # API endpoints
│   ├── scripts/           # Database seeding and utilities
│   └── tests/             # API tests
├── junoa-app/             # React frontend (Vite)
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── context/       # React context providers
│   │   ├── services/      # API service functions
│   │   └── styles/        # CSS and styling
│   └── public/            # Static assets
└── package.json           # Root package.json for scripts
```

## 🔧 Available Scripts

### Root Level
- `npm run dev` - Start both frontend and backend in development mode
- `npm run dev:backend` - Start only the backend
- `npm run dev:frontend` - Start only the frontend
- `npm run seed` - Seed the database with sample data
- `npm run install:all` - Install dependencies for all packages

### Backend
- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run seed` - Seed database

### Frontend
- `npm run dev` - Start Vite development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## 🛠️ Features

### Backend API
- **Authentication**: JWT-based auth with bcrypt password hashing
- **Journal Entries**: CRUD operations with AI insights
- **Community Posts**: Social features with likes and comments
- **Therapist Directory**: Search and contact therapists
- **User Profiles**: Personalization and preferences
- **File Uploads**: Image and document handling
- **Rate Limiting**: Security and abuse prevention

### Frontend
- **Modern UI**: React with Tailwind CSS
- **Dark/Light Mode**: Theme switching
- **Real-time Updates**: Live data synchronization
- **Responsive Design**: Mobile-first approach
- **Authentication**: Secure login/logout flow
- **Journal Writing**: Rich text editor with mood tracking
- **Community**: Social sharing and support
- **Therapist Search**: Find and connect with professionals

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Journal
- `GET /api/journal` - Get user's journal entries
- `POST /api/journal` - Create new entry
- `GET /api/journal/:id` - Get specific entry
- `PUT /api/journal/:id` - Update entry
- `DELETE /api/journal/:id` - Delete entry

### Community
- `GET /api/community` - Get community posts
- `POST /api/community` - Create new post
- `GET /api/community/:id` - Get specific post
- `POST /api/community/:id/like` - Like/unlike post
- `POST /api/community/:id/comments` - Add comment

### Therapists
- `GET /api/therapists` - Get therapists list
- `GET /api/therapists/:id` - Get specific therapist
- `GET /api/therapists/search` - Search therapists
- `POST /api/therapists/:id/contact` - Contact therapist

## 🗄️ Database Schema

### Users
- Basic info (name, email, password)
- Preferences and settings
- Statistics and activity tracking

### Journal Entries
- Content and metadata
- Mood tracking
- AI-generated insights
- Tags and categories

### Community Posts
- Content and visibility settings
- Engagement metrics
- Comments and likes

### Therapists
- Professional information
- Specialties and approaches
- Contact and availability
- Reviews and ratings

## 🔒 Security Features

- JWT token authentication
- Password hashing with bcrypt
- Rate limiting on API endpoints
- CORS configuration
- Input validation and sanitization
- Helmet.js security headers

## 🧪 Testing

```bash
# Run backend tests
cd backend && npm test

# Run with coverage
cd backend && npm run test:coverage
```

## 🚀 Deployment

### Backend Deployment
1. Set environment variables for production
2. Build and deploy to your preferred platform (Heroku, AWS, etc.)
3. Configure MongoDB Atlas for production database

### Frontend Deployment
1. Build the application: `npm run build`
2. Deploy the `dist` folder to your hosting platform
3. Configure environment variables for production API URL

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Check the API documentation at `/docs` when running the backend
- Review the health check endpoint at `/health`
- Check the console for detailed error messages

## 🔄 Development Workflow

1. **Start development**: `npm run dev`
2. **Make changes** to frontend or backend code
3. **Test changes** using the running applications
4. **Commit changes** with descriptive messages
5. **Push to repository** and create pull request

The applications will automatically reload when you make changes to the code! 