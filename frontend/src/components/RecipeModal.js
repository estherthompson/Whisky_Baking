import React, { useEffect, useCallback } from 'react';
import '../styles/RecipeModal.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faClock, faStar, faUtensils } from '@fortawesome/free-solid-svg-icons';

const RecipeModal = ({ recipe, onClose }) => {
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

  const renderStars = (score) => {
    return [...Array(5)].map((_, index) => (
      <FontAwesomeIcon
        key={index}
        icon={faStar}
        style={{ color: index < score ? '#FFD700' : '#DDD' }}
      />
    ));
  };

  if (!recipe) return null;

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content" role="dialog" aria-modal="true">
        <button className="close-button" onClick={onClose} aria-label="Close modal">
          <FontAwesomeIcon icon={faTimes} />
        </button>

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