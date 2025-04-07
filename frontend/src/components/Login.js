import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/Login.css';
import loginImage from '../assets/images/login-image.png';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    identifier: '',
    password: '',
    name: '',
    email: '',
    username: ''
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (isLogin) {
        const response = await axios.post('http://localhost:5001/api/auth/login', {
          identifier: formData.identifier,
          password: formData.password
        });
        localStorage.setItem('user', JSON.stringify(response.data));
        navigate('/user-account');
      } else {
        const signupData = {
          email: formData.email,
          password: formData.password,
          name: formData.name,
          username: formData.username
        };
        
        console.log('Sending signup data:', {
          ...signupData,
          password: '***'
        });
        
        const response = await axios.post('http://localhost:5001/api/auth/signup', signupData);
        localStorage.setItem('user', JSON.stringify(response.data));
        navigate('/user-account');
      }
    } catch (err) {
      console.error('Error details:', err.response?.data || err);
      const errorMessage = err.response?.data?.error || 
                          err.response?.data?.details?.message || 
                          err.message || 
                          'An error occurred during signup';
      setError(errorMessage);
    }
  };

  return (
    <div className="main-container">
      <div className="white-box">
        <div className="login-container">
          <div className="login-form">
            <h2>{isLogin ? 'Login' : 'Sign Up'}</h2>
            {error && (
              <div className="error-message">
                <strong>Error:</strong> {error}
                <br />
                Please try again.
              </div>
            )}
            <form onSubmit={handleSubmit}>
              {isLogin ? (
                <>
                  <div className="form-group">
                    <label>Email or Username</label>
                    <input
                      type="text"
                      name="identifier"
                      value={formData.identifier}
                      onChange={handleChange}
                      placeholder="Enter your email or username"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Password</label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Enter your password"
                      required
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="form-group">
                    <label>Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Username</label>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      placeholder="Choose a username"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Password</label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Choose a password"
                      required
                    />
                  </div>
                </>
              )}
              <button type="submit" className="submit-btn">
                {isLogin ? 'Login' : 'Sign Up'}
              </button>
              {isLogin && (
                <div className="forgot-password">
                  <a href="#" onClick={(e) => {
                    e.preventDefault();
                    console.log('Forgot password clicked');
                  }}>
                    Forgot Password?
                  </a>
                </div>
              )}
            </form>
            <p className="toggle-form">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button 
                className="toggle-btn"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                  setFormData({
                    identifier: '',
                    password: '',
                    name: '',
                    email: '',
                    username: ''
                  });
                }}
              >
                {isLogin ? 'Sign Up' : 'Login'}
              </button>
            </p>
          </div>
        </div>
        <div className="image-container">
          <img 
            src={loginImage}
            alt="Login Image" 
            className="login-image"
          />
        </div>
      </div>
    </div>
  );
};

export default Login; 