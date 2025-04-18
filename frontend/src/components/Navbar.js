import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faHome,
  faUpload,
  faUser
} from '@fortawesome/free-solid-svg-icons';
import '../styles/Navbar.css';
import logo from '../assets/images/Whisky_Baking.png';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
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
            <Link 
              to="/" 
              className={`nav-link ${isActive('/') ? 'active' : ''}`}
              onClick={() => setIsMenuOpen(false)}
            >
              <FontAwesomeIcon icon={faHome} className="nav-icon" />
              <span className="nav-text">Home</span>
            </Link>
          </li>
          <li className="nav-item">
            <Link 
              to="/upload-recipe"
              onClick={() => setIsMenuOpen(false)}
              className={`nav-link ${isActive('/upload-recipe') ? 'active' : ''}`}
            >
              <FontAwesomeIcon icon={faUpload} className="nav-icon" />
              <span className="nav-text">Upload Recipe</span>
            </Link>
          </li>
          <li className="nav-item">
            <Link 
              to='/user-account'
              onClick={() => setIsMenuOpen(false)}
              className={`nav-link ${isActive('/user-account') ? 'active' : ''}`}
            >
              <FontAwesomeIcon icon={faUser} className="nav-icon" />
              <span className="nav-text">User Account</span>
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar; 