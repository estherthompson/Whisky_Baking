import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ProfileInformation from './ProfileInformation';
import '../styles/UserAccount.css';
import profileIcon from '../assets/icons/profile.svg';
import recipesIcon from '../assets/icons/recipes.svg';
import savedIcon from '../assets/icons/saved.svg';
import settingsIcon from '../assets/icons/settings.svg';
import activityIcon from '../assets/icons/activity.svg';

const UserAccount = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (!user) {
    return null;
  }

  return (
    <div className="user-account-container">
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => handleTabClick('profile')}
        >
          <img src={profileIcon} alt="Profile" className="icon" />
          <span className="text">Profile</span>
        </button>
        <button
          className={`tab ${activeTab === 'recipes' ? 'active' : ''}`}
          onClick={() => handleTabClick('recipes')}
        >
          <img src={recipesIcon} alt="Recipes" className="icon" />
          <span className="text">My Recipes</span>
        </button>
        <button
          className={`tab ${activeTab === 'saved' ? 'active' : ''}`}
          onClick={() => handleTabClick('saved')}
        >
          <img src={savedIcon} alt="Saved" className="icon" />
          <span className="text">Saved Recipes</span>
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
        {activeTab === 'profile' && <ProfileInformation user={user} />}
        {activeTab === 'recipes' && (
          <div className="coming-soon">
            <h2>My Recipes</h2>
            <p>Coming soon! This feature will allow you to manage your recipes.</p>
          </div>
        )}
        {activeTab === 'saved' && (
          <div className="coming-soon">
            <h2>Saved Recipes</h2>
            <p>Coming soon! This feature will allow you to save and organize your favorite recipes.</p>
          </div>
        )}
        {activeTab === 'activity' && (
          <div className="coming-soon">
            <h2>Activity</h2>
            <p>Coming soon! This feature will show your recent activity.</p>
          </div>
        )}
        {activeTab === 'settings' && (
          <div>
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