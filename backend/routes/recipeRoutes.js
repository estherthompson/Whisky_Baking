import express from 'express';
import { createRecipe, getRecipeById, getAllRecipes, savedRecipe, addRatingToRecipe } from '../controllers/recipeController.js';

const router = express.Router();

// Recipe routes
router.get('/recipes', getAllRecipes);
router.get('/recipes/:id', getRecipeById);
router.post('/recipes', createRecipe);
router.post('/recipes/save', savedRecipe);

// Rating route - nested under recipes since ratings depend on recipes
router.post('/recipes/:recipeid/ratings', addRatingToRecipe);

export default router; 