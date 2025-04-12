import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/ProfileInformation.css';

const ProfileInformation = ({ user }) => {
  const [profile, setProfile] = useState({
    userid: '',
    profile_photo_url: '',
    bio: '',
    website: '',
    pronouns: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
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
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    try {
      const response = await axios.get(`http://localhost:5001/api/profile/${user.userid}`);
      if (response.data) {
        // Ensure all fields have default empty string values
        setProfile({
          userid: response.data.userid || '',
          profile_photo_url: response.data.profile_photo_url || '',
          bio: response.data.bio || '',
          website: response.data.website || '',
          pronouns: response.data.pronouns || ''
        });
        // Check if the current pronouns value is not in the predefined options
        if (response.data.pronouns && !pronounsOptions.some(option => option.value === response.data.pronouns)) {
          setShowCustomPronouns(true);
        }
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load profile information');
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

    const formData = new FormData();
    formData.append('photo', file);

    try {
      const response = await axios.post('http://localhost:5001/api/profile/upload-photo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (response.data.photoUrl) {
        setProfile(prev => ({
          ...prev,
          profile_photo_url: response.data.photoUrl,
          updated_at: new Date().toISOString()
        }));
        setSuccess('Photo uploaded successfully!');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError('Failed to upload photo');
      console.error('Error uploading photo:', err);
    }
  };

  return (
    <div className="profile-information">
      <div className="profile-header">
        <div className="profile-photo-container">
          <div className="greeting-photo-wrapper">
            <h2 className="greeting">Hello, {user.username || 'there'}!</h2>
            <img
              src={profile.profile_photo_url || '/default-profile.png'} 
              alt="Profile" 
              className="profile-photo"
            />
          </div>
          <input
            type="file"
            accept="image/*"
            onChange={handlePhotoUpload}
            className="photo-upload-input"
            id="photo-upload"
          />
          <label htmlFor="photo-upload" className="photo-upload-label">
            Change Photo
          </label>
        </div>
        <div className="profile-actions">
          <button 
            onClick={() => setIsEditing(!isEditing)}
            className="edit-profile-btn"
          >
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </button>
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

        {isEditing && (
          <button type="submit" className="save-profile-btn">
            Save Changes
          </button>
        )}
      </form>
    </div>
  );
};

export default ProfileInformation; 