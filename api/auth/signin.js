import { getDatabase } from '../lib/mongodb.js';
import { verifyPassword, generateToken } from '../lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'METHOD_NOT_ALLOWED',
      message: 'Method not allowed',
      retryable: false 
    });
  }

  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Email and password are required',
        retryable: false
      });
    }

    const db = await getDatabase();
    const usersCollection = db.collection('users');

    // Find user
    const user = await usersCollection.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        error: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
        retryable: false
      });
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
        retryable: false
      });
    }

    // Generate JWT token
    const token = generateToken({
      userId: user._id.toString(),
      email: user.email
    });

    return res.status(200).json({
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name
      }
    });

  } catch (error) {
    console.error('Signin error:', error);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to sign in. Please try again.',
      retryable: true
    });
  }
}
