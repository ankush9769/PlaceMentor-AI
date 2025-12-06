import { getDatabase } from '../lib/mongodb.js';
import { hashPassword, generateToken } from '../lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'METHOD_NOT_ALLOWED',
      message: 'Method not allowed',
      retryable: false 
    });
  }

  try {
    const { email, password, name } = req.body;

    // Validate input
    if (!email || !password || !name) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Email, password, and name are required',
        retryable: false
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Invalid email format',
        retryable: false
      });
    }

    // Validate password strength
    if (password.length < 6) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Password must be at least 6 characters long',
        retryable: false
      });
    }

    const db = await getDatabase();
    const usersCollection = db.collection('users');

    // Check if user already exists
    const existingUser = await usersCollection.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        error: 'USER_EXISTS',
        message: 'User with this email already exists',
        retryable: false
      });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const result = await usersCollection.insertOne({
      email: email.toLowerCase(),
      password: hashedPassword,
      name,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Generate JWT token
    const token = generateToken({
      userId: result.insertedId.toString(),
      email: email.toLowerCase()
    });

    return res.status(201).json({
      token,
      user: {
        id: result.insertedId.toString(),
        email: email.toLowerCase(),
        name
      }
    });

  } catch (error) {
    console.error('Signup error:', error);
    
    // Provide more specific error message
    let errorMessage = 'Failed to create account. Please try again.';
    
    if (error.message && error.message.includes('connect')) {
      errorMessage = 'Database connection failed. Please check MongoDB is running.';
    }
    
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      retryable: true
    });
  }
}
