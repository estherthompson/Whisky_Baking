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
  const [pendingReview, setPendingReview] = useState(null);

  useEffect(() => {
    const pendingReviewData = sessionStorage.getItem('pendingReview');
    if (pendingReviewData) {
      setPendingReview(JSON.parse(pendingReviewData));
      console.log('Found pending review:', JSON.parse(pendingReviewData));
    }
    
    const user = localStorage.getItem('user');
    if (user) {
      handlePostLoginRedirect(pendingReviewData);
    }
  }, [navigate]);

  const handlePostLoginRedirect = (pendingReviewData) => {
    if (pendingReviewData) {
      const reviewData = JSON.parse(pendingReviewData);
      console.log('Processing redirect for review of recipe:', reviewData.recipeId);
      
      sessionStorage.removeItem('pendingReview');
      
      navigate('/');
      
      setTimeout(() => {
        console.log('Dispatching openRecipeModal event');
        window.dispatchEvent(new CustomEvent('openRecipeModal', {
          detail: { 
            recipeId: reviewData.recipeId, 
            showReviewForm: true,
            reviewData: {
              rating: reviewData.rating,
              reviewText: reviewData.reviewText
            }
          }
        }));
      }, 500); 
    } else {
      navigate('/user-account');
    }
  };

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
        console.log('Attempting login with:', formData.identifier);
        const response = await axios.post('http://localhost:5001/api/auth/login', {
          identifier: formData.identifier,
          password: formData.password
        });
        
        // Ensure the response data has a consistent userid field
        const userData = response.data;
        console.log('Login response data:', userData);
        
        if (!userData.userid) {
          console.warn('User data missing userid field, attempting to standardize');
          userData.userid = userData.UserID || userData.userId || userData.id || userData.user_id;
        }
        
        // Store user data in localStorage
        localStorage.setItem('user', JSON.stringify(userData));
        console.log('Login successful, user stored in localStorage with ID:', userData.userid);
        
        const draftReviewString = localStorage.getItem('draftReview');
        if (draftReviewString) {
          const draftReview = JSON.parse(draftReviewString);
          navigate('/', { 
            state: { 
              openRecipeId: draftReview.recipeId,
              draftReview: {
                rating: draftReview.rating,
                reviewText: draftReview.reviewText
              }
            }
          });
          return;
        }
        
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
        
        // Store user data and log in automatically
        const userData = response.data;
        console.log('Signup response data:', userData);
        
        if (!userData.userid) {
          console.warn('User data missing userid field, attempting to standardize');
          userData.userid = userData.UserID || userData.userId || userData.id || userData.user_id;
        }
        
        // Store user data in localStorage
        localStorage.setItem('user', JSON.stringify(userData));
        console.log('Signup successful, user stored in localStorage with ID:', userData.userid);
        
        // Navigate to user account page
        navigate('/user-account');
      }
    } catch (err) {
      console.error('Error details:', err.response?.data || err);
      const errorMessage = err.response?.data?.error || 
                          err.response?.data?.details?.message || 
                          err.message || 
                          'An error occurred during authentication';
      setError(errorMessage);
      
      // Reset verification state if there was an error
      setVerificationSent(false);
    }
  };

  return (
    <div className="main-container">
      <div className="login-welcome-banner">
        {isLogin ? (
          <>
            <h3>Welcome Back!</h3>
            <p>LOG IN TO ACCESS YOUR SAVED RECIPES AND PERSONAL REVIEWS</p>
            {pendingReview && (
              <div className="pending-review-note">
                <small>You'll be returned to your review after login</small>
              </div>
            )}
          </>
        ) : (
          <>
            <h3>Join the Community!</h3>
            <p>SIGN UP TO CREATE, SAVE, AND REVIEW YOUR FAVORITE RECIPES</p>
          </>
        )}
      </div>
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
                  <p>You can now login to your account.</p>
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