import React, { useEffect, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/RecipeModal.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTimes, 
  faClock, 
  faStar, 
  faUtensils, 
  faCheck, 
  faSave, 
  faPaperPlane 
} from '@fortawesome/free-solid-svg-icons';
import savedIcon from '../assets/icons/saved_home.png';
import axios from 'axios';

const RecipeModal = ({ recipe, onClose, initialShowReviewForm = false, draftReview }) => {
  const navigate = useNavigate();
  const [saveMessage, setSaveMessage] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewText, setReviewText] = useState('');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewMessage, setReviewMessage] = useState(null);
  
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
          text: 'You need to log in through User Account to save a recipe'
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
        userid: userId,
        recipeId: recipe.recipeid,
        dateSaved: new Date().toISOString() // Current timestamp in ISO format
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
      
      // Dispatch an event to notify that a recipe was saved (for refreshing the Saved Recipes tab)
      window.dispatchEvent(new CustomEvent('recipeSaved', {
        detail: {
          recipeId: recipe.recipeid,
          userId: userId
        }
      }));
      
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

  const renderInteractiveStars = () => {
    return [...Array(5)].map((_, index) => (
      <FontAwesomeIcon
        key={index}
        icon={faStar}
        style={{ 
          color: index < (hoverRating || rating) ? '#FFD700' : '#DDD',
          cursor: 'pointer',
          fontSize: '1.5rem',
          marginRight: '5px'
        }}
        onClick={() => setRating(index + 1)}
        onMouseEnter={() => setHoverRating(index + 1)}
        onMouseLeave={() => setHoverRating(0)}
      />
    ));
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    
    // Get user from localStorage first to check authentication
    const userString = localStorage.getItem('user');
    
    if (!userString) {
      setReviewMessage({
        type: 'error',
        text: 'You must be logged in to write a review. Please log in through User Account.'
      });
      setTimeout(() => setReviewMessage(null), 5000);
      return;
    }
    
    if (rating === 0) {
      setReviewMessage({
        type: 'error',
        text: 'Please select a rating'
      });
      return;
    }

    if (!reviewText.trim()) {
      setReviewMessage({
        type: 'error',
        text: 'Please write a review'
      });
      return;
    }
    
    setIsSubmittingReview(true);
    
    try {
      const user = JSON.parse(userString);
      
      // Check for user ID using the same approach as in handleSaveClick
      const possibleIdProps = ['UserID', 'userid', 'userId', 'user_id', 'id', 'ID'];
      let userId = null;
      
      for (const prop of possibleIdProps) {
        if (user[prop] !== undefined) {
          userId = user[prop];
          break;
        }
      }
      
      if (!userId) {
        const idProps = Object.keys(user).filter(key => 
          key.toLowerCase().includes('id') && user[key]
        );
        
        if (idProps.length > 0) {
          userId = user[idProps[0]];
        }
      }
      
      if (!userId) {
        setReviewMessage({
          type: 'error',
          text: 'Unable to identify your account. Please log out and log in again.'
        });
        setIsSubmittingReview(false);
        return;
      }
      
      // Prepare the review data
      const reviewData = {
        userId: userId,
        recipeId: recipe.recipeid,
        score: rating,
        reviewText: reviewText,
        datePosted: new Date().toISOString()
      };
      
      console.log('Submitting review:', reviewData);
      
      // Submit the review
      const response = await axios.post('http://localhost:5001/api/recipes/rating', reviewData);
      console.log('Review submission response:', response.data);
      
      // Update the recipe's ratings array with the new review
      if (recipe.ratings) {
        recipe.ratings.push({
          ...reviewData,
          user_account: { name: user.name || user.username || 'Anonymous' },
          ratingid: response.data.ratingid
        });
        
        // Recalculate average rating
        const totalRating = recipe.ratings.reduce((sum, r) => sum + r.score, 0);
        recipe.averageRating = totalRating / recipe.ratings.length;
      }
      
      setReviewMessage({
        type: 'success',
        text: 'Your review has been submitted!'
      });
      
      // Clear form and draft
      setRating(0);
      setReviewText('');
      setShowReviewForm(false);
      
      // Clear both localStorage items
      localStorage.removeItem('draftReview');
      
      // Clear message after 5 seconds
      setTimeout(() => setReviewMessage(null), 5000);
      
    } catch (error) {
      console.error('Error submitting review:', error);
      
      setReviewMessage({
        type: 'error',
        text: error.response?.data?.error || 'Failed to submit review. Please try again later.'
      });
    } finally {
      setIsSubmittingReview(false);
    }
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

  // Effect to handle initialization and draft review data
  useEffect(() => {
    // Check for draft review in localStorage
    const draftReviewString = localStorage.getItem('draftReview');
    if (draftReviewString) {
      const savedDraft = JSON.parse(draftReviewString);
      if (savedDraft.recipeId === recipe.recipeid) {
        console.log('Restoring draft review:', savedDraft);
        setRating(savedDraft.rating || 0);
        setReviewText(savedDraft.reviewText || '');
        setShowReviewForm(true);
        // Don't remove the draft yet - wait until successful submission
      }
    } else if (draftReview) {
      // If draft review was passed as prop (from navigation state)
      console.log('Setting review from navigation state:', draftReview);
      setRating(draftReview.rating || 0);
      setReviewText(draftReview.reviewText || '');
      setShowReviewForm(true);
    } else {
      // No draft review, use initial state
      setShowReviewForm(initialShowReviewForm);
      setRating(0);
      setReviewText('');
    }
  }, [recipe.recipeid, draftReview, initialShowReviewForm]);

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
              <p className="recipe-description">By: {recipe.user_account?.name || recipe.user_account?.username || 'Unknown'}</p>
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
            
            {reviewMessage && (
              <div className={`review-message ${reviewMessage.type}`}>
                {reviewMessage.type === 'success' && <FontAwesomeIcon icon={faCheck} />}
                <span>{reviewMessage.text}</span>
              </div>
            )}
            
            {!showReviewForm ? (
              <div className="add-review-section">
                <button 
                  className="add-review-button"
                  onClick={() => {
                    const userString = localStorage.getItem('user');
                    if (!userString) {
                      setReviewMessage({
                        type: 'error',
                        text: 'You must be logged in to write a review. Please log in through User Account.'
                      });
                      setTimeout(() => setReviewMessage(null), 5000);
                      return;
                    }
                    setShowReviewForm(true);
                  }}
                >
                  Write a Review
                </button>
              </div>
            ) : (
              <div className="review-form-container">
                <form onSubmit={handleSubmitReview} className="review-form">
                  <div className="rating-input">
                    <label>Your Rating:</label>
                    <div className="stars-container">
                      {renderInteractiveStars()}
                    </div>
                  </div>
                  
                  <div className="review-input">
                    <label htmlFor="reviewText">Your Review:</label>
                    <textarea
                      id="reviewText"
                      name="reviewText"
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      placeholder="Share your experience with this recipe..."
                      rows={4}
                    />
                  </div>
                  
                  <div className="review-form-actions">
                    <button 
                      type="button" 
                      className="cancel-button"
                      onClick={() => {
                        setShowReviewForm(false);
                        setRating(0);
                        setReviewText('');
                      }}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="submit-button"
                      disabled={isSubmittingReview}
                    >
                      {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
                      {!isSubmittingReview && <FontAwesomeIcon icon={faPaperPlane} />}
                    </button>
                  </div>
                </form>
              </div>
            )}
            
            {recipe.ratings && recipe.ratings.length > 0 ? (
              <div className="reviews-list">
                {recipe.ratings.map((review) => (
                  <div key={review.ratingid} className="review-item">
                    <div className="review-header">
                      <span className="reviewer-name">
                        {review.user_account?.name || 'Anonymous'}
                      </span>
                      <span className="review-date">
                        {new Date(review.dateposted).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="review-rating">
                      {renderStars(review.score)}
                    </div>
                    <p className="review-text">{review.reviewtext}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-reviews">No reviews yet. Be the first to review!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecipeModal; 