import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/Navbar.css';
import logo from '../assets/images/Whisky_Baking.png';

const Navbar = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleUserAccountClick = () => {
    // Check if user is logged in
    const user = localStorage.getItem('user');
    if (user) {
      navigate('/user-account');
    } else {
      navigate('/login');
    }
    setIsMenuOpen(false);
  };

  const handleUploadRecipeClick = () => {
    // Check if user is logged in
    const user = localStorage.getItem('user');
    if (user) {
      navigate('/upload-recipe');
    } else {
      navigate('/login');
    }
    setIsMenuOpen(false);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          <img src={logo} alt="Whisky Baking Logo" style={{ height: '40px', width: 'auto' }} />
        </Link>
        <button className="mobile-menu-btn" onClick={toggleMenu}>
          {isMenuOpen ? '✕' : '☰'}
        </button>
        <ul className={`nav-menu ${isMenuOpen ? 'active' : ''}`}>
          <li className="nav-item">
            <Link to="/" className="nav-link" onClick={() => setIsMenuOpen(false)}>
              Home
            </Link>
          </li>
          <li className="nav-item">
            <button 
              onClick={handleUploadRecipeClick}
              className="nav-link"
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Upload Recipe
            </button>
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