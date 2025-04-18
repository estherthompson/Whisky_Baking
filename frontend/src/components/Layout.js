import React from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from './Navbar.js';
import '../styles/Layout.css';

const Layout = ({ children }) => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  return (
    <div className={`layout ${isHomePage ? 'home-page' : ''}`}>
      <Navbar />
      <main className="main-content">
        {children}
      </main>
      <footer className="footer">
        <p>&copy; 2024 Whisky Baking. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Layout; 