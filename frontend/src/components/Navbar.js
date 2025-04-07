import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/Navbar.css';

const Navbar = () => {
  const navigate = useNavigate();

  const handleUserAccountClick = () => {
    // Check if user is logged in
    const user = localStorage.getItem('user');
    if (user) {
      navigate('/user-account');
    } else {
      navigate('/login');
    }
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          Whisky Baking
        </Link>
        <ul className="nav-menu">
          <li className="nav-item">
            <Link to="/" className="nav-link">
              Home
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/upload-recipe" className="nav-link">
              Upload Recipe
            </Link>
          </li>
          <li className="nav-item">
            <button 
              onClick={handleUserAccountClick}
              className="nav-link"
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              User Account
            </button>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar; 