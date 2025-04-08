import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './components/Home';
import Login from './components/Login';
import UserAccount from './components/UserAccount';
import './styles/global.css';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/user-account" element={<UserAccount />} />
          {/* Add more routes here as needed */}
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
