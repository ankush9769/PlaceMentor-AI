import React, { useState } from 'react';
import '../styles/components/Profile.css';

const Profile = ({ user, onBack, onUpdateProfile }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name || '',
    email: user.email || '',
    phone: user.phone || ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update profile');
      }

      // Update local storage
      const updatedUser = { ...user, ...formData };
      localStorage.setItem('user', JSON.stringify(updatedUser));

      setSuccess('Profile updated successfully!');
      setIsEditing(false);
      
      // Call parent callback to update user state
      if (onUpdateProfile) {
        onUpdateProfile(updatedUser);
      }
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || ''
    });
    setIsEditing(false);
    setError('');
    setSuccess('');
  };

  return (
    <div className="profile-container">
      <div className="profile-header-section">
        <div className="profile-avatar">
          <span className="avatar-icon">👤</span>
          <div className="avatar-badge">Pro</div>
        </div>
        <div className="profile-info">
          <h1 className="profile-name">{user.name}</h1>
          <p className="profile-email">{user.email}</p>
          <span className="profile-status">
            <span className="status-indicator"></span>
            Active Account
          </span>
        </div>
      </div>

      {error && (
        <div className="message error-message">
          <span className="message-icon">❌</span>
          {error}
        </div>
      )}

      {success && (
        <div className="message success-message">
          <span className="message-icon">✅</span>
          {success}
        </div>
      )}

      <div className="profile-content">
        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-section">
            <div className="section-header">
              <h2 className="section-title">Personal Information</h2>
              <p className="section-description">Update your personal details and contact information</p>
            </div>

            <div className="form-group">
              <label htmlFor="name" className="form-label">
                Full Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                disabled={!isEditing}
                required
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                disabled={!isEditing}
                required
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone" className="form-label">
                Phone Number
                <span className="optional-badge">Optional</span>
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                disabled={!isEditing}
                placeholder="+1 (555) 123-4567"
                className="form-input"
              />
              <span className="input-hint">
                Phone number can be used for notifications and account recovery
              </span>
            </div>
          </div>

          <div className="form-section">
            <div className="section-header">
              <h2 className="section-title">Account Overview</h2>
              <p className="section-description">Your account activity and membership details</p>
            </div>
            
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">📅</div>
                <div className="stat-content">
                  <span className="stat-label">Member Since</span>
                  <span className="stat-value">
                    {new Date(user.createdAt || Date.now()).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">⚡</div>
                <div className="stat-content">
                  <span className="stat-label">Account Type</span>
                  <span className="stat-value">Premium</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🔒</div>
                <div className="stat-content">
                  <span className="stat-label">Security</span>
                  <span className="stat-value status-secure">Verified</span>
                </div>
              </div>
            </div>
          </div>

          <div className="form-actions">
            {!isEditing ? (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="btn btn-edit"
              >
                <span className="btn-icon">✏️</span>
                Edit Profile
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="btn btn-cancel"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-save"
                  disabled={isLoading}
                >
                  <span className="btn-icon">{isLoading ? '⏳' : '💾'}</span>
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;
