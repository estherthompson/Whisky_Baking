import React, { useEffect, useCallback } from 'react';
import './RecipeModal.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faClock, faStar } from '@fortawesome/free-solid-svg-icons';

const RecipeModal = ({ recipe, onClose }) => {
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
            <h2>{recipe.name}</h2>
            <p className="recipe-description">{recipe.description}</p>
            <div className="recipe-meta">
              <span className="prep-time">
                <FontAwesomeIcon icon={faClock} /> {recipe.recipetime || 'N/A'} min
              </span>
              <span className="rating">
                <FontAwesomeIcon icon={faStar} /> {recipe.average_rating || 'N/A'}
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
        </div>
      </div>
    </div>
  );
};

export default RecipeModal; 