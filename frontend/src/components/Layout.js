import React from 'react';
import Navbar from './Navbar.js';
import '../styles/Layout.css';

const Layout = ({ children }) => {
  return (
    <div className="layout">
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