import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/Login.css';
import loginImage from '../assets/images/login-image.png';
import logo from '../assets/images/Whisky_Baking.png';

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
  const [verificationSent, setVerificationSent] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    const user = localStorage.getItem('user');
    if (user) {
      navigate('/user-account');
    }
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setVerificationSent(false);

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
        
        await axios.post('http://localhost:5001/api/auth/signup', signupData);
        setVerificationSent(true);
        setFormData({
          identifier: '',
          password: '',
          name: '',
          email: '',
          username: ''
        });
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
            {!verificationSent && (
              <>
                <img src={logo} alt="Whisky Baking Logo" className="login-logo" />
                <h2>{isLogin ? 'Login' : 'Sign Up'}</h2>
              </>
            )}
            {verificationSent && (
              <div className="success-message">
                <div className="success-content">
                  <strong>Verification Email Sent!</strong>
                  <p>Please check your email to verify your account. Once verified, you can login.</p>
                  <button 
                    className="toggle-btn"
                    onClick={() => {
                      setIsLogin(true);
                      setVerificationSent(false);
                    }}
                  >
                    Go to Login
                  </button>
                </div>
              </div>
            )}
            {error && (
              <div className="error-message">
                <strong>Error:</strong> {error}
                <br />
                Please try again.
              </div>
            )}
            {!verificationSent && (
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
            )}
            {!verificationSent && (
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
            )}
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