import React, { useState } from 'react';
import '../../styles/auth/Auth.enhanced.css';

const ForgotPassword = ({ onBackToSignIn }) => {
  const [email, setEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState('email'); // 'email', 'reset'

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send reset token');
      }

      setSuccess('A reset token has been generated. Please check your email or use the token shown below.');
      setResetToken(data.resetToken); // In production, this should be sent via email
      setStep('reset');
    } catch (err) {
      console.error('Forgot password error:', err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          token: resetToken, 
          newPassword 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to reset password');
      }

      setSuccess('Password reset successfully! Redirecting to sign in...');
      setTimeout(() => {
        onBackToSignIn();
      }, 2000);
    } catch (err) {
      console.error('Reset password error:', err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">🔐</div>
          <h1 className="auth-title">
            {step === 'email' ? 'Forgot Password' : 'Reset Password'}
          </h1>
          <p className="auth-subtitle">
            {step === 'email' 
              ? 'Enter your email to receive a reset token' 
              : 'Enter your new password'}
          </p>
        </div>

        {step === 'email' ? (
          <form onSubmit={handleRequestReset} className="auth-form">
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}
            
            {success && (
              <div className="success-message">
                {success}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="form-input"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="submit-btn"
            >
              {isLoading && <span className="loading-spinner"></span>}
              {isLoading ? 'Sending...' : 'Send Reset Token'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="auth-form">
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}
            
            {success && (
              <div className="success-message">
                {success}
              </div>
            )}

            {resetToken && (
              <div className="info-message">
                <strong>Your Reset Token:</strong>
                <div style={{ 
                  marginTop: '8px', 
                  padding: '12px', 
                  background: '#f0f0f0', 
                  borderRadius: '4px',
                  fontFamily: 'monospace',
                  fontSize: '14px',
                  wordBreak: 'break-all'
                }}>
                  {resetToken}
                </div>
                <small style={{ display: 'block', marginTop: '8px', opacity: 0.7 }}>
                  Note: In production, this would be sent to your email.
                </small>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="resetToken" className="form-label">
                Reset Token
              </label>
              <input
                type="text"
                id="resetToken"
                value={resetToken}
                onChange={(e) => setResetToken(e.target.value)}
                placeholder="Enter the reset token from your email"
                required
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="newPassword" className="form-label">
                New Password
              </label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                required
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
                className="form-input"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="submit-btn"
            >
              {isLoading && <span className="loading-spinner"></span>}
              {isLoading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}

        <div className="auth-footer">
          Remember your password?{' '}
          <span onClick={onBackToSignIn} className="auth-link">
            Back to Sign In
          </span>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
