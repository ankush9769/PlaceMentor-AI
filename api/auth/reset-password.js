import { getDatabase } from '../lib/mongodb.js';
import { hashPassword } from '../lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'METHOD_NOT_ALLOWED',
      message: 'Method not allowed',
      retryable: false 
    });
  }

  try {
    const { email, token, newPassword } = req.body;

    // Validate input
    if (!email || !token || !newPassword) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Email, token, and new password are required',
        retryable: false
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Password must be at least 6 characters long',
        retryable: false
      });
    }

    const db = await getDatabase();
    const usersCollection = db.collection('users');

    // Find user with valid reset token
    const user = await usersCollection.findOne({ 
      email: email.toLowerCase(),
      resetToken: token,
      resetTokenExpiry: { $gt: new Date() } // Check if token hasn't expired
    });

    if (!user) {
      return res.status(400).json({
        error: 'INVALID_TOKEN',
        message: 'Invalid or expired reset token',
        retryable: false
      });
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password and clear reset token
    await usersCollection.updateOne(
      { email: email.toLowerCase() },
      {
        $set: {
          password: hashedPassword
        },
        $unset: {
          resetToken: '',
          resetTokenExpiry: ''
        }
      }
    );

    return res.status(200).json({
      message: 'Password reset successfully'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to reset password. Please try again.',
      retryable: true
    });
  }
}
