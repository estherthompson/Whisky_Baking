import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/UserAccount.css';
import settingsIcon from '../assets/icons/settings.svg';
import activityIcon from '../assets/icons/activity.svg';
import adminIcon from '../assets/icons/admin.svg';
import recipesIcon from '../assets/icons/recipes.svg';
import savedIcon from '../assets/icons/saved.svg';

const UserAccount = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));
  const [activeTab, setActiveTab] = useState('admin');
  const [userData, setUserData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    username: user?.username || '',
    pronouns: user?.pronouns || '',
    bio: user?.bio || '',
    personal_links: user?.personal_links || ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    setError('');
    setSuccess('');
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUserUpdate = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.put(
        `http://localhost:5001/api/auth/update/${user.userid}`,
        {
          name: userData.name,
          username: userData.username,
          pronouns: userData.pronouns,
          bio: userData.bio,
          personal_links: userData.personal_links
        }
      );
      // Update localStorage with new user data
      const updatedUser = { ...user, ...response.data };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUserData(response.data);
      setIsEditing(false);
      setSuccess('Account updated successfully!');
      setError('');
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to update account');
      setSuccess('');
    }
  };

  if (!user) {
    return null;
  }

  const isAdmin = user.isadmin;

  return (
    <div className="user-account-container">
      <div className="tabs">
        {isAdmin && (
          <button
            className={`tab ${activeTab === 'admin' ? 'active' : ''}`}
            onClick={() => handleTabClick('admin')}
          >
            <img src={adminIcon} alt="Admin" className="icon" />
            <span className="text">Admin Dashboard</span>
          </button>
        )}
        <button
          className={`tab ${activeTab === 'recipes' ? 'active' : ''}`}
          onClick={() => handleTabClick('recipes')}
        >
          <img src={recipesIcon} alt="Content" className="icon" />
          <span className="text">My Content</span>
        </button>
        <button
          className={`tab ${activeTab === 'saved' ? 'active' : ''}`}
          onClick={() => handleTabClick('saved')}
        >
          <img src={savedIcon} alt="Saved" className="icon" />
          <span className="text">Saved Content</span>
        </button>
        <button
          className={`tab ${activeTab === 'activity' ? 'active' : ''}`}
          onClick={() => handleTabClick('activity')}
        >
          <img src={activityIcon} alt="Activity" className="icon" />
          <span className="text">Activity</span>
        </button>
        <button
          className={`tab ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => handleTabClick('settings')}
        >
          <img src={settingsIcon} alt="Settings" className="icon" />
          <span className="text">Settings</span>
        </button>
      </div>

      <div className="tab-content">
        {isAdmin && activeTab === 'admin' && (
          <div className="admin-dashboard">
            <h2>Admin Dashboard</h2>
            <div className="admin-stats">
              <div className="stat-card">
                <h3>Total Users</h3>
                <p>1</p>
              </div>
              <div className="stat-card">
                <h3>Pending Approvals</h3>
                <p>0</p>
              </div>
              <div className="stat-card">
                <h3>Total Content</h3>
                <p>0</p>
              </div>
            </div>
            <div className="admin-actions">
              <button className="admin-btn">Manage Users</button>
              <button className="admin-btn">Review Content</button>
              <button className="admin-btn">View Reports</button>
            </div>
          </div>
        )}
        {activeTab === 'recipes' && (
          <div className="coming-soon">
            <h2>My Content</h2>
            <p>This section will display all your created content and allow you to manage it.</p>
          </div>
        )}
        {activeTab === 'saved' && (
          <div className="coming-soon">
            <h2>Saved Content</h2>
            <p>Here you can find all the content you've saved for later reference.</p>
          </div>
        )}
        {activeTab === 'activity' && (
          <div className="coming-soon">
            <h2>Activity</h2>
            <p>This section will show your recent activity and interactions.</p>
          </div>
        )}
        {activeTab === 'settings' && (
          <div className="settings-container">
            <h2>Account Settings</h2>
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}
            <form onSubmit={handleUserUpdate}>
              <div className="form-group">
                <label htmlFor="name">Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={userData.name}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={userData.email}
                  disabled
                />
              </div>
              <div className="form-group">
                <label>Username</label>
                <input
                  type="text"
                  name="username"
                  value={userData.username}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  required
                />
              </div>
              <div className="form-group">
                <label>Pronouns</label>
                <input
                  type="text"
                  name="pronouns"
                  value={userData.pronouns}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  placeholder="Optional (e.g., they/them)"
                />
              </div>
              <div className="form-group">
                <label>Bio</label>
                <textarea
                  name="bio"
                  value={userData.bio}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  placeholder="Tell us about yourself"
                  rows="4"
                />
              </div>
              <div className="form-group">
                <label>Personal Links</label>
                <textarea
                  name="personal_links"
                  value={userData.personal_links}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  placeholder="Add your website, social media, or other links (one per line)"
                  rows="3"
                />
              </div>
              <div className="form-group">
                <label>Role</label>
                <input
                  type="text"
                  value={user.isadmin ? 'Admin' : 'User'}
                  disabled
                />
              </div>
              <div className="button-group">
                {!isEditing ? (
                  <button
                    type="button"
                    className="edit-btn"
                    onClick={() => setIsEditing(true)}
                  >
                    Edit Account
                  </button>
                ) : (
                  <>
                    <button type="submit" className="save-btn">
                      Save Changes
                    </button>
                    <button
                      type="button"
                      className="cancel-btn"
                      onClick={() => {
                        setIsEditing(false);
                        setError('');
                        setSuccess('');
                      }}
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </form>
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