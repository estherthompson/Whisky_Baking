import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/UserAccount.css';
import adminIcon from '../assets/icons/admin.svg';
import recipeIcon from '../assets/icons/recipes.svg';
import savedIcon from '../assets/icons/saved.svg';
import activityIcon from '../assets/icons/activity.svg';
import settingsIcon from '../assets/icons/settings.svg';
import defaultProfileImage from '../assets/images/login-image.png';
import UserManagement from './UserManagement';

const UserAccount = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));
  const [activeTab, setActiveTab] = useState('admin');
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [imagePreview, setImagePreview] = useState(user?.profileImage || defaultProfileImage);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  if (!user) {
    return null;
  }

  const handleLogout = () => {
    // Clear user data from localStorage
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    
    // Redirect to login page
    navigate('/login');
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const isAdmin = user.isadmin;

  return (
    <div className="user-account-container">
      <div className="tabs-container">
        <div className="tabs">
          {isAdmin && (
            <button
              className={`tab ${activeTab === 'admin' ? 'active' : ''}`}
              onClick={() => setActiveTab('admin')}
            >
              <img src={adminIcon} alt="Admin" className="icon" />
              <span className="text">Admin Dashboard</span>
            </button>
          )}
          <button
            className={`tab ${activeTab === 'my-recipes' ? 'active' : ''}`}
            onClick={() => setActiveTab('my-recipes')}
          >
            <img src={recipeIcon} alt="My Recipes" className="icon" />
            <span className="text">My Recipes</span>
          </button>
          {!isAdmin && (
            <>
              <button
                className={`tab ${activeTab === 'saved' ? 'active' : ''}`}
                onClick={() => setActiveTab('saved')}
              >
                <img src={savedIcon} alt="Saved" className="icon" />
                <span className="text">Saved Recipes</span>
              </button>
              <button
                className={`tab ${activeTab === 'activity' ? 'active' : ''}`}
                onClick={() => setActiveTab('activity')}
              >
                <img src={activityIcon} alt="Activity" className="icon" />
                <span className="text">Activity</span>
              </button>
            </>
          )}
          <button
            className={`tab ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <img src={settingsIcon} alt="Settings" className="icon" />
            <span className="text">Settings</span>
          </button>
        </div>
      </div>

      <div className="tab-content">
        {isAdmin && activeTab === 'admin' && (
          <div className="admin-dashboard">
            <h2>Admin Dashboard</h2>
            <UserManagement setShowUserManagement={setShowUserManagement} />
          </div>
        )}
        {activeTab === 'my-recipes' && (
          <div className="my-recipes">
            <h2>My Recipes</h2>
            {/* My Recipes content will go here */}
          </div>
        )}
        {!isAdmin && activeTab === 'saved' && (
          <div className="saved-recipes">
            <h2>Saved Recipes</h2>
            {/* Saved Recipes content will go here */}
          </div>
        )}
        {!isAdmin && activeTab === 'activity' && (
          <div className="activity">
            <h2>Activity</h2>
            {/* Activity content will go here */}
          </div>
        )}
        {activeTab === 'settings' && (
          <div className="settings">
            <h2>Settings</h2>
            <div className="settings-sections">
              <div className="settings-section">
                <h3>Profile Information</h3>
                <form className="profile-form">
                  <div className="form-group">
                    <label htmlFor="profile_image">Profile Image</label>
                    <div className="profile-image-container">
                      <img 
                        src={imagePreview} 
                        alt="Profile" 
                        className="profile-image-preview" 
                      />
                    </div>
                    <input 
                      type="file" 
                      id="profile_image" 
                      name="profile_image" 
                      accept="image/*" 
                      onChange={handleImageChange}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="username">Username</label>
                    <input type="text" id="username" name="username" value={user.username} readOnly />
                  </div>
                  <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input type="email" id="email" name="email" value={user.email} readOnly />
                  </div>
                  <div className="form-group">
                    <label htmlFor="pronouns">Pronouns</label>
                    <input type="text" id="pronouns" name="pronouns" placeholder="Enter your pronouns" />
                  </div>
                  <div className="form-group">
                    <label htmlFor="bio">Bio</label>
                    <textarea id="bio" name="bio" placeholder="Tell us about yourself"></textarea>
                  </div>
                  <div className="form-group">
                    <label htmlFor="personal_links">Personal Links</label>
                    <input type="url" id="personal_links" name="personal_links" placeholder="Enter your personal links" />
                  </div>
                  <button type="submit" className="save-btn">Save Changes</button>
                </form>
              </div>
              <div className="settings-section">
                <h3>Notification Preferences</h3>
                <form className="notifications-form">
                  <div className="checkbox-group">
                    <input type="checkbox" id="email_notifications" name="email_notifications" />
                    <label htmlFor="email_notifications">Email Notifications</label>
                    <p className="description">Receive emails about new recipe comments, likes, and follows.</p>
                  </div>
                  <div className="checkbox-group">
                    <input type="checkbox" id="recipe_updates" name="recipe_updates" />
                    <label htmlFor="recipe_updates">Recipe Updates</label>
                    <p className="description">Get notified when recipes you've saved are updated.</p>
                  </div>
                  <div className="checkbox-group">
                    <input type="checkbox" id="newsletter" name="newsletter" />
                    <label htmlFor="newsletter">Weekly Newsletter</label>
                    <p className="description">Receive our weekly newsletter with trending recipes and cooking tips.</p>
                  </div>
                  <button type="submit" className="save-btn">Save Preferences</button>
                </form>
              </div>
              <div className="settings-section">
                <h3>Privacy Settings</h3>
                <form className="privacy-form">
                  <div className="checkbox-group">
                    <input type="checkbox" id="public_profile" name="public_profile" />
                    <label htmlFor="public_profile">Public Profile</label>
                    <p className="description">Allow other users to view your profile and recipes.</p>
                  </div>
                  <div className="checkbox-group">
                    <input type="checkbox" id="show_activity" name="show_activity" />
                    <label htmlFor="show_activity">Show Activity</label>
                    <p className="description">Show your activity (likes, comments) to other users.</p>
                  </div>
                  <button type="submit" className="save-btn">Save Privacy Settings</button>
                </form>
              </div>
              <div className="settings-section">
                <h3>Account Management</h3>
                <div className="account-actions">
                  <button className="action-btn change-password-btn">Change Password</button>
                  <button className="action-btn delete-account-btn">Delete Account</button>
                </div>
              </div>
            </div>
            <button className="logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserAccount; 