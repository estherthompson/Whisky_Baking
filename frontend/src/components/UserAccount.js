import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/UserAccount.css';
import adminIcon from '../assets/icons/admin.svg';
import recipeIcon from '../assets/icons/recipes.svg';
import savedIcon from '../assets/icons/saved.svg';
import activityIcon from '../assets/icons/activity.svg';
import settingsIcon from '../assets/icons/settings.svg';
import UserManagement from './UserManagement';

const UserAccount = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));
  const [activeTab, setActiveTab] = useState('admin');
  const [showUserManagement, setShowUserManagement] = useState(false);

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