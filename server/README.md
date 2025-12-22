# Milesto Backend API

A complete Node.js/Express backend for the Milesto project management application with JWT authentication and MongoDB integration.

## Features

- **JWT Authentication** - Secure user registration and login
- **MongoDB Integration** - Complete database models and operations
- **Project Management** - Create, update, and manage final year projects
- **Task Management** - Assign and track project tasks
- **Document Management** - Upload and AI-analyze project documents
- **Team Collaboration** - Invite and manage team members
- **AI Analysis** - Mock AI document analysis with scoring
- **Dashboard Analytics** - Project statistics and insights
- **Security** - Helmet, CORS, rate limiting, and input validation

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn

## Installation

1. **Navigate to the server directory:**

   ```bash
   cd server
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Set up environment variables:**
   - Copy `.env.example` to `.env`
   - Update the values in `.env`:
     ```
     MONGODB_URI=mongodb://localhost:27017/Milesto
     JWT_SECRET=your_super_secret_jwt_key_here
     PORT=5000
     NODE_ENV=development
     CORS_ORIGIN=http://localhost:5173
     EMAIL_USER=your-email@gmail.com
     EMAIL_PASS=your-app-password
     FRONTEND_URL=http://localhost:5173
     ```

## Email Configuration

To enable real email invitations, you need to configure Gmail SMTP:

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate an App Password:**
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a password for "Mail"
3. **Update .env file:**
   ```
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-16-character-app-password
   ```

### Alternative Email Providers

You can also use other email providers by updating the transporter configuration in `utils/emailService.js`:

**Outlook/Hotmail:**

```javascript
service: "hotmail";
```

**Custom SMTP:**

```javascript
host: 'smtp.your-provider.com',
port: 587,
secure: false
```

4. **Start MongoDB:**

   - If using local MongoDB: `mongod`
   - If using MongoDB Compass, ensure the connection is active

5. **Start the server:**

   ```bash
   # Development mode with auto-restart
   npm run dev

   # Production mode
   npm start
   ```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/verify` - Verify JWT token
- `PATCH /api/auth/profile` - Update user profile
- `PATCH /api/auth/password` - Change password

### Projects

- `GET /api/projects` - Get user's projects
- `GET /api/projects/:id` - Get specific project
- `POST /api/projects` - Create new project
- `PATCH /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Tasks

- `GET /api/tasks` - Get user's tasks
- `GET /api/tasks/:id` - Get specific task
- `POST /api/tasks` - Create new task
- `PATCH /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### Documents

- `GET /api/documents` - Get user's documents
- `GET /api/documents/:id` - Get specific document
- `POST /api/documents` - Upload new document
- `POST /api/documents/:id/analyze` - AI analyze document
- `PATCH /api/documents/:id` - Update document
- `DELETE /api/documents/:id` - Delete document

### Team Management

- `GET /api/team/members` - Get team members
- `POST /api/team/invite` - Invite team member
- `PATCH /api/team/members/:id` - Update member role
- `DELETE /api/team/members/:id` - Remove team member

### Dashboard

- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/recent-projects` - Get recent projects
- `GET /api/dashboard/recent-tasks` - Get recent tasks
- `GET /api/dashboard/ai-insights` - Get AI insights

### Settings

- `PATCH /api/settings/notifications` - Update notification settings
- `PATCH /api/settings/privacy` - Update privacy settings
- `GET /api/settings/export` - Export user data

## Database Models

### User

- Name, email, password (hashed)
- University, role (student/faculty)
- Bio, avatar, activity tracking

### Project

- Title, description, type, status
- Progress tracking, deadlines
- Team members with roles
- AI scoring and insights

### Task

- Title, description, status, priority
- Assignment and due dates
- Project association

### Document

- Title, type, content, file handling
- AI analysis with scoring
- Version control

## Security Features

- **Password Hashing** - bcryptjs with salt rounds
- **JWT Tokens** - Secure authentication with expiration
- **Input Validation** - express-validator for all inputs
- **Rate Limiting** - Prevent API abuse
- **CORS Protection** - Configured for frontend origin
- **Helmet** - Security headers
- **File Upload Security** - Type and size restrictions

## AI Analysis

The backend includes a mock AI analysis system that:

- Analyzes document content and type
- Provides completeness scoring (0-100)
- Identifies issues and suggestions
- Supports different document types (SRS, UML, reports, etc.)

## Development

### Adding New Features

1. Create new routes in `/routes`
2. Add database models in `/models`
3. Update middleware if needed
4. Test with frontend integration

### Database Connection

The app connects to MongoDB on startup. Ensure your MongoDB instance is running:

```bash
# Local MongoDB
mongod

# Or use MongoDB Compass GUI
```

### Testing

Test the API endpoints using:

- Postman
- curl commands
- Frontend integration

### Example API Usage

```javascript
POST /api/auth/register
{
  "name": "John Doe",
  "email": "john@university.edu",
  "password": "password123",
  "university": "University Name",
  "role": "student"
}

POST /api/projects
Authorization: Bearer <jwt_token>
{
  "title": "My Final Year Project",
  "description": "A web application for...",
  "type": "web-application",
  "deadline": "2024-05-01"
}
```

## Production Deployment

1. Set `NODE_ENV=production`
2. Use a production MongoDB instance
3. Set strong JWT secret
4. Configure proper CORS origins
5. Use process manager (PM2)
6. Set up SSL/HTTPS
7. Configure logging

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**

   - Ensure MongoDB is running
   - Check connection string in `.env`

2. **JWT Token Issues**

   - Verify JWT_SECRET is set
   - Check token expiration

3. **CORS Errors**

   - Update CORS_ORIGIN in `.env`
   - Ensure frontend URL matches

4. **File Upload Issues**
   - Check file size limits
   - Verify upload directory permissions

## Contributing

1. Fork the repository
2. Create feature branch
3. Make changes with tests
4. Submit pull request

## License

This project is licensed under the ISC License.
