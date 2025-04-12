import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/ProfileInformation.css';

const ProfileInformation = ({ user }) => {
  const [profile, setProfile] = useState({
    profile_photo_url: null,
    bio: '',
    website: '',
    pronouns: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCustomPronouns, setShowCustomPronouns] = useState(false);

  const pronounsOptions = [
    { value: '', label: 'Select pronouns' },
    { value: 'she/her', label: 'she/her' },
    { value: 'he/him', label: 'he/him' },
    { value: 'they/them', label: 'they/them' },
    { value: 'they/she', label: 'they/she' },
    { value: 'they/he', label: 'they/he' },
    { value: 'she/they', label: 'she/they' },
    { value: 'he/they', label: 'he/they' }
  ];

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`http://localhost:5001/api/profile/${user.userid}`);
      if (response.data) {
        setProfile({
          ...response.data,
          profile_photo_url: response.data.profile_photo_url || null
        });
        if (response.data.pronouns && !pronounsOptions.some(option => option.value === response.data.pronouns)) {
          setShowCustomPronouns(true);
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Failed to load profile information');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePronounsChange = (e) => {
    const value = e.target.value;
    if (value === 'other') {
      setShowCustomPronouns(true);
      setProfile(prev => ({ ...prev, pronouns: '' }));
    } else {
      setShowCustomPronouns(false);
      setProfile(prev => ({ ...prev, pronouns: value }));
    }
  };

  const handleCustomPronounsChange = (e) => {
    setProfile(prev => ({ ...prev, pronouns: e.target.value }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: value || '' // Ensure empty string if value is null/undefined
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.put('http://localhost:5001/api/profile', {
        ...profile,
        updated_at: new Date().toISOString()
      });
      
      if (response.data) {
        setProfile(response.data);
        setSuccess('Profile updated successfully!');
        setIsEditing(false);
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError('Failed to update profile');
      console.error('Error updating profile:', err);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setIsLoading(true);
      const formData = new FormData();
      formData.append('photo', file);

      const response = await axios.post('http://localhost:5001/api/profile/photo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data && response.data.profile_photo_url) {
        setProfile(prev => ({
          ...prev,
          profile_photo_url: response.data.profile_photo_url
        }));
        setSuccess('Profile photo updated successfully');
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      setError('Failed to upload profile photo');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="profile-information">
      <div className="profile-header">
        <div className="profile-photo-container">
          <div className="greeting-photo-wrapper">
            <h2 className="greeting">Hello, {user?.username || 'there'}!</h2>
            {isLoading ? (
              <div className="profile-photo-loading">Loading...</div>
            ) : (
              <>
                {profile.profile_photo_url ? (
                  <img
                    src={profile.profile_photo_url}
                    alt="Profile"
                    className="profile-photo"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://via.placeholder.com/150';
                    }}
                  />
                ) : (
                  <div className="profile-photo-placeholder">
                    <span>No photo</span>
                  </div>
                )}
                <input
                  type="file"
                  id="photo-upload"
                  className="photo-upload-input"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                />
                <label htmlFor="photo-upload" className="photo-upload-label">
                  {isLoading ? 'Uploading...' : 'Change Photo'}
                </label>
              </>
            )}
          </div>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <form onSubmit={handleSubmit} className="profile-form">
        <div className="form-group">
          <label>Pronouns (optional)</label>
          {isEditing ? (
            <>
              <select
                name="pronouns"
                value={showCustomPronouns ? 'other' : (profile.pronouns || '')}
                onChange={handlePronounsChange}
                className="pronouns-select"
              >
                {pronounsOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
                <option value="other">Other</option>
              </select>
              {showCustomPronouns && (
                <input
                  type="text"
                  name="pronouns"
                  value={profile.pronouns || ''}
                  onChange={handleCustomPronounsChange}
                  placeholder="Enter your pronouns"
                  className="custom-pronouns-input"
                />
              )}
            </>
          ) : (
            <p className="profile-text">{profile.pronouns || 'Not specified'}</p>
          )}
        </div>

        <div className="form-group">
          <label>Bio (optional)</label>
          {isEditing ? (
            <textarea
              name="bio"
              value={profile.bio || ''}
              onChange={handleChange}
              placeholder="Tell us about yourself..."
              rows="4"
            />
          ) : (
            <p className="profile-text">{profile.bio || 'No bio yet'}</p>
          )}
        </div>

        <div className="form-group">
          <label>Website (optional)</label>
          {isEditing ? (
            <input
              type="url"
              name="website"
              value={profile.website || ''}
              onChange={handleChange}
              placeholder="Your website"
            />
          ) : (
            <p className="profile-text">
              {profile.website ? (
                <a href={profile.website} target="_blank" rel="noopener noreferrer">
                  {profile.website}
                </a>
              ) : (
                'No website set'
              )}
            </p>
          )}
        </div>

        <div className="form-actions">
          {!isEditing ? (
            <button 
              type="button"
              onClick={() => setIsEditing(true)}
              className="edit-profile-btn"
            >
              Edit Profile
            </button>
          ) : (
            <>
              <button type="submit" className="save-profile-btn">
                Save Changes
              </button>
              <button 
                type="button"
                onClick={() => setIsEditing(false)}
                className="cancel-btn"
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </form>
    </div>
  );
};

export default ProfileInformation; 