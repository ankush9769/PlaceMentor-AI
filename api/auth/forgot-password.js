import { getDatabase } from '../lib/mongodb.js';
import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'METHOD_NOT_ALLOWED',
      message: 'Method not allowed',
      retryable: false 
    });
  }

  try {
    const { email } = req.body;

    // Validate input
    if (!email) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Email is required',
        retryable: false
      });
    }

    const db = await getDatabase();
    const usersCollection = db.collection('users');

    // Find user
    const user = await usersCollection.findOne({ email: email.toLowerCase() });
    
    // For security, don't reveal if user exists or not
    if (!user) {
      // Still return success to prevent email enumeration
      return res.status(200).json({
        message: 'If an account exists with this email, a reset token will be sent.',
        resetToken: null
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // Store reset token in database
    await usersCollection.updateOne(
      { email: email.toLowerCase() },
      {
        $set: {
          resetToken,
          resetTokenExpiry
        }
      }
    );

    // In production, you would send this token via email
    // For development/demo purposes, we'll return it in the response
    // TODO: Integrate email service (SendGrid, AWS SES, etc.)
    
    return res.status(200).json({
      message: 'Reset token generated successfully',
      resetToken // Remove this in production after implementing email service
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to process request. Please try again.',
      retryable: true
    });
  }
}
