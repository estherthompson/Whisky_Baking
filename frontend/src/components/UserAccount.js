import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ProfileInformation from './ProfileInformation';
import '../styles/UserAccount.css';

const UserAccount = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (!user) {
    return null;
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="tab-content">
            <ProfileInformation user={user} />
          </div>
        );
      case 'recipes':
        return (
          <div className="tab-content">
            <h2>My Recipes</h2>
            <p>This is where user's recipes will be displayed.</p>
          </div>
        );
      case 'favorites':
        return (
          <div className="tab-content">
            <h2>Favorite Recipes</h2>
            <p>This is where favorite recipes will be displayed.</p>
          </div>
        );
      case 'settings':
        return (
          <div className="tab-content">
            <h2>Account Settings</h2>
            <p>This is where account settings will be displayed.</p>
          </div>
        );
      case 'activity':
        return (
          <div className="tab-content">
            <h2>Activity History</h2>
            <p>This is where user activity will be displayed.</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="user-account-container">
      <div className="tabs-container">
        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            Profile
          </button>
          <button 
            className={`tab ${activeTab === 'recipes' ? 'active' : ''}`}
            onClick={() => setActiveTab('recipes')}
          >
            My Recipes
          </button>
          <button 
            className={`tab ${activeTab === 'favorites' ? 'active' : ''}`}
            onClick={() => setActiveTab('favorites')}
          >
            Favorites
          </button>
          <button 
            className={`tab ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            Settings
          </button>
          <button 
            className={`tab ${activeTab === 'activity' ? 'active' : ''}`}
            onClick={() => setActiveTab('activity')}
          >
            Activity
          </button>
        </div>
        <button onClick={handleLogout} className="logout-btn">
          Logout
        </button>
      </div>
      {renderTabContent()}
    </div>
  );
};

export default UserAccount; 