import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/UserAccount.css';

const UserAccount = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="main-container">
      <div className="white-box">
        <div className="user-info-container">
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
          <div className="user-info">
            <h2>Account Information</h2>
            <p><strong>Name:</strong> {user.name}</p>
            <p><strong>Username:</strong> {user.username}</p>
            <p><strong>Email:</strong> {user.email}</p>
            {user.isadmin && <p className="admin-badge">Admin User</p>}
          </div>
        </div>
        <div className="image-container">
          <img 
            src="/baking-image.jpg" 
            alt="Baking illustration" 
            className="baking-image"
          />
        </div>
      </div>
    </div>
  );
};

export default UserAccount; 