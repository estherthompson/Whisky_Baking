import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import '../styles/Recipe.css';

const Recipe = () => {
  const { recipeId } = useParams();
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Here you would fetch the recipe data based on recipeId
    // For now, we'll use mock data
    const fetchRecipe = async () => {
      try {
        // Replace this with your actual API call
        const response = await fetch(`/api/recipes/${recipeId}`);
        const data = await response.json();
        setRecipe(data);
      } catch (error) {
        console.error('Error fetching recipe:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecipe();
  }, [recipeId]);

  if (loading) {
    return <div className="recipe-loading">Loading recipe...</div>;
  }

  if (!recipe) {
    return <div className="recipe-error">Recipe not found</div>;
  }

  return (
    <div className="recipe-container">
      <div className="recipe-header">
        <h1>{recipe.title}</h1>
        <img src={recipe.image} alt={recipe.title} className="recipe-image" />
      </div>
      <div className="recipe-details">
        <div className="recipe-ingredients">
          <h2>Ingredients</h2>
          <ul>
            {recipe.ingredients.map((ingredient, index) => (
              <li key={index}>{ingredient}</li>
            ))}
          </ul>
        </div>
        <div className="recipe-instructions">
          <h2>Instructions</h2>
          <ol>
            {recipe.instructions.map((instruction, index) => (
              <li key={index}>{instruction}</li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
};

export default Recipe; 