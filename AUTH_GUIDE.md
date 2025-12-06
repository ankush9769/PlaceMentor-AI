# Authentication System Guide

## Overview

The AI Interview Simulator now includes a complete authentication system with user accounts, secure login, and personal dashboards.

## Features

### 1. User Authentication
- **Sign Up**: Create a new account with email and password
- **Sign In**: Log in to existing account
- **JWT Tokens**: Secure token-based authentication
- **Password Hashing**: Passwords are securely hashed using bcrypt
- **Session Persistence**: Stay logged in across browser sessions

### 2. User Dashboard
- **Statistics**: View total interviews, average score, and best score
- **Interview History**: See all past interviews with detailed information
- **Quick Start**: Easy access to start new interviews
- **Profile Info**: Display user name and email

### 3. Interview History
Each saved interview includes:
- Technology stack and difficulty level
- Scores for clarity, accuracy, and depth
- Overall performance score
- Number of questions answered
- Completion date and time

## API Endpoints

### Authentication

#### POST /api/auth/signup
Create a new user account.

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "email": "john@example.com",
    "name": "John Doe"
  }
}
```

#### POST /api/auth/signin
Sign in to existing account.

**Request:**
```json
{
  "email": "john@example.com",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "email": "john@example.com",
    "name": "John Doe"
  }
}
```

### Interview Management

#### POST /api/interviews/save
Save completed interview (requires authentication).

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request:**
```json
{
  "config": {
    "techStack": "Python",
    "level": "junior",
    "timeLimit": 15
  },
  "questions": [...],
  "answers": [...],
  "completedAt": "2024-01-01T12:00:00Z"
}
```

#### GET /api/interviews/history
Get user's interview history (requires authentication).

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "interviews": [
    {
      "id": "interview_id",
      "techStack": "Python",
      "level": "junior",
      "scores": {
        "clarity": 4.2,
        "accuracy": 4.5,
        "depth": 3.8,
        "overall": 4.17
      },
      "questionsCount": 5,
      "answeredCount": 5,
      "completedAt": "2024-01-01T12:00:00Z"
    }
  ]
}
```

## Database Schema

### Users Collection
```javascript
{
  _id: ObjectId,
  email: String (unique, lowercase),
  password: String (hashed),
  name: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Interviews Collection
```javascript
{
  _id: ObjectId,
  userId: String,
  config: {
    techStack: String,
    level: String,
    timeLimit: Number
  },
  questions: Array,
  answers: Array,
  scores: {
    clarity: Number,
    accuracy: Number,
    depth: Number,
    overall: Number
  },
  completedAt: Date,
  createdAt: Date
}
```

## Security Features

1. **Password Hashing**: All passwords are hashed using bcrypt with salt rounds
2. **JWT Tokens**: Secure token-based authentication with 7-day expiration
3. **Protected Routes**: Interview history and saving require valid authentication
4. **Input Validation**: All inputs are validated before processing
5. **Error Handling**: Secure error messages that don't expose sensitive information

## Environment Variables

Required environment variables:

```env
# OpenAI API
OPENAI_API_KEY=your_openai_api_key

# MongoDB
MONGODB_URI=mongodb://localhost:27017/ai-interview-simulator

# JWT Secret (IMPORTANT: Change in production!)
JWT_SECRET=your-super-secret-jwt-key

# Environment
NODE_ENV=development
```

## Usage Flow

1. **New User**:
   - User visits app → Sign Up page
   - Creates account with email/password
   - Automatically logged in → Dashboard
   - Can start interviews

2. **Returning User**:
   - User visits app → Sign In page (or auto-login if session exists)
   - Enters credentials
   - Redirected to Dashboard
   - Views history and starts new interviews

3. **Interview Flow**:
   - User clicks "Start New Interview" on Dashboard
   - Selects configuration
   - Completes interview
   - Interview automatically saved to database
   - Results displayed
   - Returns to Dashboard

## Local Storage

The app stores the following in localStorage:
- `token`: JWT authentication token
- `user`: User information (id, email, name)

These are automatically cleared on logout.

## Production Deployment

For production deployment:

1. **Change JWT_SECRET**: Use a strong, random secret key
2. **Use MongoDB Atlas**: Set up a cloud MongoDB instance
3. **Environment Variables**: Set all variables in Vercel dashboard
4. **HTTPS**: Ensure all traffic is over HTTPS
5. **Rate Limiting**: Consider adding rate limiting to auth endpoints

## Troubleshooting

### "Authentication required" error
- Check if token is stored in localStorage
- Verify token hasn't expired (7 days)
- Try logging out and back in

### "Failed to connect to MongoDB"
- Verify MongoDB is running (local) or connection string is correct (Atlas)
- Check network connectivity
- Verify credentials in connection string

### "User already exists"
- Email is already registered
- Try signing in instead
- Use a different email address

## Future Enhancements

Potential improvements:
- Password reset functionality
- Email verification
- Social login (Google, GitHub)
- Profile editing
- Interview sharing
- Performance analytics charts
- Leaderboards
