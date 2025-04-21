import React, { useEffect, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/RecipeModal.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faClock, faStar, faUtensils, faCheck, faSave } from '@fortawesome/free-solid-svg-icons';
import savedIcon from '../assets/icons/saved_home.png';
import axios from 'axios';

const RecipeModal = ({ recipe, onClose }) => {
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [reviews, setReviews] = useState([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleEscapeKey = useCallback((event) => {
    if (event.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleEscapeKey);
    document.body.style.overflow = 'hidden'; // Prevent body scrolling when modal is open
    
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'auto'; // Restore body scrolling when modal is closed
    };
  }, [handleEscapeKey]);

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleSaveClick = async () => {
    // Add visual feedback that the button was clicked
    setIsSaving(true);
    
    try {
      // Get user from localStorage and check authentication more thoroughly
      const userString = localStorage.getItem('user');
      console.log('Raw user string:', userString);
      
      if (!userString) {
        console.error('No user data in localStorage');
        setSaveMessage({
          type: 'error',
          text: 'You need to log in to save recipes'
        });
        setTimeout(() => setSaveMessage(null), 5000);
        setIsSaving(false);
        return;
      }
      
      const user = JSON.parse(userString);
      console.log('Parsed user data:', user);
      console.log('User object keys:', Object.keys(user));
      
      // Check for empty user object
      if (!user || Object.keys(user).length === 0) {
        console.error('Empty user object');
        setSaveMessage({
          type: 'error',
          text: 'You need to log in to save recipes'
        });
        setTimeout(() => setSaveMessage(null), 5000);
        setIsSaving(false);
        return;
      }
      
      // Check all possible ID properties
      // Try each possible property name for user ID
      const possibleIdProps = ['UserID', 'userid', 'userId', 'user_id', 'id', 'ID'];
      let userId = null;
      
      for (const prop of possibleIdProps) {
        if (user[prop] !== undefined) {
          userId = user[prop];
          console.log(`Found user ID in property: ${prop}`, userId);
          break;
        }
      }
      
      // If we still don't have a userId, look for any property with "id" in the name
      if (!userId) {
        const idProps = Object.keys(user).filter(key => 
          key.toLowerCase().includes('id') && user[key]
        );
        
        if (idProps.length > 0) {
          userId = user[idProps[0]];
          console.log(`Found potential ID in property: ${idProps[0]}`, userId);
        }
      }
      
      if (!userId) {
        console.error('Could not find any user ID property in:', user);
        setSaveMessage({
          type: 'error',
          text: 'Unable to identify your account. Please log out and log in again.'
        });
        setTimeout(() => setSaveMessage(null), 5000);
        setIsSaving(false);
        return;
      }
      
      // Prepare the data for saving to saved_recipes table
      const savedRecipeData = {
        userId: userId,
        recipeId: recipe.recipeid,
        datesaved: new Date().toISOString() // Current timestamp in ISO format
      };
      
      console.log('Saving recipe with data:', savedRecipeData);
      
      // Save the recipe using the API
      const response = await axios.post('http://localhost:5001/api/recipes/save', savedRecipeData);
      
      console.log('Save recipe API response:', response.data);
      
      // Show success message
      setSaveMessage({
        type: 'success',
        text: 'Recipe saved! You can find it in your account under Saved Recipes.'
      });
      
      // Clear message after 5 seconds
      setTimeout(() => setSaveMessage(null), 5000);
      
    } catch (error) {
      console.error('Error details:', error);
      
      // Check for duplicate save error
      if (error.response && error.response.status === 400 && 
          error.response.data && error.response.data.error === 'Recipe is already saved by this user') {
        setSaveMessage({
          type: 'info',
          text: 'This recipe is already saved in your account.'
        });
      } else {
        // Show general error message
        setSaveMessage({
          type: 'error',
          text: 'Failed to save recipe. Please try again later.'
        });
      }
      
      // Clear message after 5 seconds
      setTimeout(() => setSaveMessage(null), 5000);
    } finally {
      // Reset saving state after a short delay for visual feedback
      setTimeout(() => setIsSaving(false), 500);
    }
  };

  const renderStars = (score) => {
    return [...Array(5)].map((_, index) => (
      <FontAwesomeIcon
        key={index}
        icon={faStar}
        style={{ color: index < score ? '#FFD700' : '#DDD' }}
      />
    ));
  };

  // Update the debug useEffect
  useEffect(() => {
    // Debug authentication state when component mounts
    try {
      const user = localStorage.getItem('user');
      console.log('localStorage user string:', user);
      
      if (user) {
        const parsedUser = JSON.parse(user);
        console.log('Parsed user object:', parsedUser);
        console.log('Available keys in user object:', Object.keys(parsedUser));
        
        // Check all possible ID properties and their types
        console.log('User ID check:', {
          UserID: parsedUser.UserID,
          userid: parsedUser.userid,
          userId: parsedUser.userId,
          user_id: parsedUser.user_id,
          id: parsedUser.id,
          types: {
            UserID: typeof parsedUser.UserID,
            userid: typeof parsedUser.userid,
            userId: typeof parsedUser.userId,
            user_id: typeof parsedUser.user_id,
            id: typeof parsedUser.id
          }
        });
      } else {
        console.log('No user found in localStorage');
      }
    } catch (error) {
      console.error('Error parsing user data:', error);
    }
  }, []);
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      setErrorMessage('Please select a rating');
      return;
    }
    if (!reviewText.trim()) {
      setErrorMessage('Please write a review');
      return;
    }

    try {
      // Get the current user's ID from localStorage or your auth context
      const userData = JSON.parse(localStorage.getItem('user'));
      if (!userData || !userData.userid) {
        console.log('No user found, redirecting to login');
        // Store the current URL and recipe ID to redirect back after login
        const redirectData = {
          path: window.location.pathname,
          recipeId: recipe.recipeid,
          scrollToReviews: true
        };
        localStorage.setItem('redirectAfterLogin', JSON.stringify(redirectData));
        // Redirect to login page
        window.location.href = '/login';
        return;
      }

      const requestData = {
        userid: userData.userid,
        score: rating,
        reviewtext: reviewText,
      };

      // Use the same base URL as your other API calls
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';
      const endpoint = `${API_BASE_URL}/api/recipes/${recipe.recipeid}/ratings`;

      console.log('Submitting review to:', endpoint);
      console.log('Request data:', requestData);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      console.log('Response status:', response.status);
      const responseText = await response.text();
      console.log('Response text:', responseText);

      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        console.error('Error parsing response:', e);
        throw new Error('Invalid response from server');
      }

      if (!response.ok) {
        throw new Error(responseData.message || responseData.error || 'Failed to submit review');
      }

      console.log('Review submitted successfully:', responseData);
      
      // Update the recipe's ratings array with the new review
      const newReview = {
        ...responseData,
        user_account: { name: userData.name },
        dateposted: new Date().toISOString()
      };
      
      recipe.ratings = [...(recipe.ratings || []), newReview];
      // Update the average rating
      const totalRating = recipe.ratings.reduce((sum, review) => sum + review.score, 0);
      recipe.averageRating = totalRating / recipe.ratings.length;
      
      setShowReviewForm(false);
      setRating(0);
      setReviewText('');
      setErrorMessage('');
      setSuccessMessage('Review submitted successfully!');
    } catch (error) {
      console.error('Error submitting review:', error);
      if (error.message === 'Failed to fetch') {
        setErrorMessage('Could not connect to the server. Please make sure the backend server is running on port 5001.');
      } else {
        setErrorMessage(error.message || 'Failed to submit review. Please try again.');
      }
    }
  };

  if (!recipe) return null;

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content" role="dialog" aria-modal="true">
        <div className="modal-actions">
          <button 
            className={`save-recipe-button ${isSaving ? 'saving' : ''}`} 
            onClick={handleSaveClick} 
            aria-label="Save recipe"
            disabled={isSaving}
          >
            <img src={savedIcon} alt="Save Recipe" />
          </button>
          <button className="close-button" onClick={onClose} aria-label="Close modal">
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        {saveMessage && (
          <div className={`save-message ${saveMessage.type}`}>
            {saveMessage.type === 'success' && <FontAwesomeIcon icon={faCheck} />}
            {saveMessage.type === 'info' && <FontAwesomeIcon icon={faSave} />}
            <span>{saveMessage.text}</span>
          </div>
        )}

        <div className="modal-left">
          <div className="modal-image">
            {recipe.imageurl ? (
              <img 
                src={recipe.imageurl} 
                alt={recipe.name} 
                onError={(e) => {
                  console.log('Image failed to load:', recipe.imageurl);
                  e.target.onerror = null;
                  e.target.src = '/placeholder-recipe.jpg';
                }}
              />
            ) : (
              <div className="recipe-placeholder-icon">
                <FontAwesomeIcon icon={faUtensils} size="3x" />
              </div>
            )}
          </div>
        </div>

        <div className="modal-right">
          <div className="modal-header">
            <h2 className="recipe-title">{recipe.name}</h2>
            <div className="recipe-description-container">
              <p className="recipe-description">{recipe.description}</p>
            </div>
            <div className="recipe-meta">
              <span className="prep-time">
                <FontAwesomeIcon icon={faClock} /> {recipe.recipetime || 'N/A'} min
              </span>
              <span className="rating">
                <FontAwesomeIcon icon={faStar} /> {recipe.averageRating?.toFixed(1) || 'N/A'} ({recipe.ratings?.length || 0} reviews)
              </span>
            </div>
          </div>

          <div className="recipe-ingredients">
            <h3>Ingredients</h3>
            <ul>
              {recipe.ingredients && recipe.ingredients.length > 0 ? (
                recipe.ingredients.map((ingredient, index) => (
                  <li key={index}>
                    {ingredient.quantity} {ingredient.name}
                  </li>
                ))
              ) : (
                <li>No ingredients listed</li>
              )}
            </ul>
          </div>

          {recipe.instructions && (
            <div className="recipe-instructions">
              <h3>Instructions</h3>
              <p>{recipe.instructions}</p>
            </div>
          )}

          <div className="recipe-reviews">
            <h3>Ratings and Reviews</h3>
            {!showReviewForm ? (
              <button 
                className="add-review-btn"
                onClick={() => setShowReviewForm(true)}
              >
                Add Review
              </button>
            ) : (
              <form className="review-form" onSubmit={handleReviewSubmit}>
                <div className="rating-input">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <FontAwesomeIcon
                      key={star}
                      icon={faStar}
                      onClick={() => setRating(star)}
                      style={{ color: star <= rating ? '#FFD700' : '#DDD', cursor: 'pointer' }}
                    />
                  ))}
                </div>
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Write your review here..."
                  rows="4"
                />
                {errorMessage && <div className="error-message">{errorMessage}</div>}
                {successMessage && <div className="success-message">{successMessage}</div>}
                <div className="review-form-buttons">
                  <button type="submit">Submit Review</button>
                  <button type="button" onClick={() => setShowReviewForm(false)}>Cancel</button>
                </div>
              </form>
            )}
            
            {recipe.ratings && recipe.ratings.length > 0 ? (
              <div className="reviews-list">
                {recipe.ratings.map((review) => (
                  <div key={review.ratingid} className="review-item">
                    <div className="review-header">
                      <span className="review-user">{review.user_account?.name || 'Anonymous'}</span>
                      <span className="review-date">
                        {new Date(review.dateposted).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="review-rating">
                      {renderStars(review.score)}
                    </div>
                    <p className="review-comment">{review.reviewtext}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p>No reviews yet. Be the first to review this recipe!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecipeModal; 