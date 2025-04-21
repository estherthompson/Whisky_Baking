import React, { useEffect, useCallback, useState } from 'react';
import '../styles/RecipeModal.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faClock, faStar } from '@fortawesome/free-solid-svg-icons';

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
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [handleEscapeKey]);

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
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
        <button className="close-button" onClick={onClose} aria-label="Close modal">
          <FontAwesomeIcon icon={faTimes} />
        </button>

        <div className="modal-left">
          {recipe.imageurl && (
            <div className="modal-image">
              <img src={recipe.imageurl} alt={recipe.name} />
            </div>
          )}
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
              {recipe.ingredients && recipe.ingredients.map((ingredient, index) => (
                <li key={index}>
                  {ingredient.quantity} {ingredient.name}
                </li>
              ))}
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