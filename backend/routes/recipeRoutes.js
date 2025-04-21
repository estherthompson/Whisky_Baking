import express from 'express';
import { createRecipe, getRecipeById, getAllRecipes, savedRecipe, addRatingToRecipe, debugGetUserRecipes, getSavedRecipes } from '../controllers/recipeController.js';

const router = express.Router();

// Recipe routes
router.get('/recipes', getAllRecipes);
router.get('/recipes/:id', getRecipeById);
router.post('/recipes', createRecipe);
router.post('/recipes/save', savedRecipe);

// User recipes route - for "My Recipes" functionality
router.get('/user/:userId/recipes', (req, res) => {
  console.log('User recipes route hit with userId:', req.params.userId);
  req.query.userId = req.params.userId;
  console.log('Set query parameter:', req.query);
  return getAllRecipes(req, res);
});

// Saved recipes route - for saved recipes functionality
router.get('/user/:userId/saved-recipes', getSavedRecipes);

// Debug route for direct testing
router.get('/debug/user/:userId/recipes', debugGetUserRecipes);

// Rating route - nested under recipes since ratings depend on recipes
router.post('/recipes/:recipeid/ratings', addRatingToRecipe);

export default router; 