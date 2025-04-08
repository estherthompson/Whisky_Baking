import React from 'react';
import { useParams } from 'react-router-dom';
import '../styles/RecipeDetail.css';

const RecipeDetail = () => {
  const { recipeId } = useParams();
  
  // Mock recipe data - in a real app, this would come from an API
  const mockRecipes = {
    1: {
      id: 1,
      title: 'Classic Vanilla Cake',
      ingredients: ['flour', 'sugar', 'eggs', 'butter', 'vanilla extract', 'baking powder', 'milk', 'salt'],
      instructions: [
        'Preheat oven to 350°F',
        'Mix dry ingredients',
        'Cream butter and sugar',
        'Add eggs and vanilla',
        'Alternate adding dry ingredients and milk',
        'Bake for 30-35 minutes'
      ],
      image: '/images/vanilla-cake.jpg'
    },
    2: {
      id: 2,
      title: 'Eggless Vanilla Cake',
      ingredients: ['flour', 'sugar', 'butter', 'vanilla extract', 'baking powder', 'milk', 'salt', 'yogurt'],
      instructions: [
        'Preheat oven to 350°F',
        'Mix dry ingredients',
        'Cream butter and sugar',
        'Add yogurt and vanilla',
        'Alternate adding dry ingredients and milk',
        'Bake for 30-35 minutes'
      ],
      image: '/images/vanilla-cake.jpg'
    },
    3: {
      id: 3,
      title: 'Dairy-Free Vanilla Cake',
      ingredients: ['flour', 'sugar', 'eggs', 'vegetable oil', 'vanilla extract', 'baking powder', 'water', 'salt'],
      instructions: [
        'Preheat oven to 350°F',
        'Mix dry ingredients',
        'Whisk eggs and sugar',
        'Add oil and vanilla',
        'Alternate adding dry ingredients and water',
        'Bake for 30-35 minutes'
      ],
      image: '/images/vanilla-cake.jpg'
    },
    4: {
      id: 4,
      title: 'Gluten-Free Vanilla Cake',
      ingredients: ['almond flour', 'sugar', 'eggs', 'butter', 'vanilla extract', 'baking powder', 'milk', 'salt', 'xanthan gum'],
      instructions: [
        'Preheat oven to 350°F',
        'Mix dry ingredients including xanthan gum',
        'Cream butter and sugar',
        'Add eggs and vanilla',
        'Alternate adding dry ingredients and milk',
        'Bake for 30-35 minutes'
      ],
      image: '/images/vanilla-cake.jpg'
    },
    5: {
      id: 5,
      title: 'Vegan Vanilla Cake',
      ingredients: ['flour', 'sugar', 'apple sauce', 'vegetable oil', 'vanilla extract', 'baking powder', 'almond milk', 'salt', 'vinegar'],
      instructions: [
        'Preheat oven to 350°F',
        'Mix dry ingredients',
        'Combine wet ingredients including apple sauce',
        'Mix vinegar with almond milk',
        'Combine all ingredients',
        'Bake for 30-35 minutes'
      ],
      image: '/images/vanilla-cake.jpg'
    },
    6: {
      id: 6,
      title: 'Low-Sugar Vanilla Cake',
      ingredients: ['flour', 'honey', 'eggs', 'butter', 'vanilla extract', 'baking powder', 'milk', 'salt', 'stevia'],
      instructions: [
        'Preheat oven to 350°F',
        'Mix dry ingredients',
        'Cream butter and honey',
        'Add eggs and vanilla',
        'Alternate adding dry ingredients and milk',
        'Bake for 30-35 minutes'
      ],
      image: '/images/vanilla-cake.jpg'
    }
  };

  const recipe = mockRecipes[recipeId];

  if (!recipe) {
    return <div className="recipe-not-found">Recipe not found</div>;
  }

  return (
    <div className="recipe-detail">
      <div className="recipe-header">
        <h1>{recipe.title}</h1>
        <img src={recipe.image} alt={recipe.title} className="recipe-image" />
      </div>
      
      <div className="recipe-content">
        <div className="ingredients-section">
          <h2>Ingredients</h2>
          <ul>
            {recipe.ingredients.map((ingredient, index) => (
              <li key={index}>{ingredient}</li>
            ))}
          </ul>
        </div>
        
        <div className="instructions-section">
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

export default RecipeDetail; 