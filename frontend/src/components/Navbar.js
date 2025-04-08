import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Navbar.css';

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          Whisk-Y Baking
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
            <Link to="/user-account" className="nav-link">
              User Account
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar; 