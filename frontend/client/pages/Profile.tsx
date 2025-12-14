import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Navigation from '@/components/Navigation';
import './Profile.css';

const Profile: React.FC = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    bio: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage('');

    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      setMessage('✓ Profile updated successfully!');
      setIsEditing(false);
    } catch (err) {
      setMessage('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Navigation />
      <div className="container" style={{ paddingTop: 'var(--spacing-lg)' }}>
        <div className="page-header">
          <h1>My Profile</h1>
          <p>Manage your account information</p>
        </div>

        {message && (
          <div
            className={`alert ${message.includes('successfully') ? 'alert-success' : 'alert-error'}`}
          >
            {message}
          </div>
        )}

        <div className="profile-card">
          <div className="profile-header">
            <div className="profile-avatar">
              {user?.name?.charAt(0).toUpperCase() || '👤'}
            </div>
            <div className="profile-info">
              <h2>{formData.name}</h2>
              <p>{formData.email}</p>
            </div>
          </div>

          <div className="profile-content">
            {!isEditing ? (
              <div className="profile-view">
                <div className="profile-field">
                  <label>Full Name</label>
                  <p>{formData.name}</p>
                </div>
                <div className="profile-field">
                  <label>Email</label>
                  <p>{formData.email}</p>
                </div>
                <div className="profile-field">
                  <label>Phone</label>
                  <p>{formData.phone || 'Not provided'}</p>
                </div>
                <div className="profile-field">
                  <label>Bio</label>
                  <p>{formData.bio || 'No bio added yet'}</p>
                </div>
                <button
                  className="btn btn-primary"
                  onClick={() => setIsEditing(true)}
                >
                  Edit Profile
                </button>
              </div>
            ) : (
              <div className="profile-edit">
                <div className="form-group">
                  <label htmlFor="name">Full Name</label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleInputChange}
                    disabled={isSaving}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email (Read-only)</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    disabled
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="phone">Phone</label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+91 1234567890"
                    disabled={isSaving}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="bio">Bio</label>
                  <textarea
                    id="bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    placeholder="Tell us about yourself..."
                    disabled={isSaving}
                  />
                </div>

                <div className="profile-actions">
                  <button
                    className="btn btn-primary"
                    onClick={handleSave}
                    disabled={isSaving}
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setIsEditing(false)}
                    disabled={isSaving}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="account-settings">
          <h2>Account Settings</h2>
          <div className="settings-grid">
            <div className="setting-item">
              <div className="setting-info">
                <h3>Two-Factor Authentication</h3>
                <p>Add an extra layer of security to your account</p>
              </div>
              <button className="btn btn-secondary btn-small">Enable</button>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <h3>Email Notifications</h3>
                <p>Manage email notification preferences</p>
              </div>
              <button className="btn btn-secondary btn-small">Configure</button>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <h3>Change Password</h3>
                <p>Update your password regularly for security</p>
              </div>
              <button className="btn btn-secondary btn-small">Change</button>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <h3>Download Data</h3>
                <p>Download all your account data</p>
              </div>
              <button className="btn btn-secondary btn-small">Download</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Profile;
