import express from 'express';
import { createRecipe, getRecipeById, getAllRecipes, savedRecipe } from '../controllers/recipeController.js';

const router = express.Router();

// Recipe routes
router.get('/recipes', getAllRecipes);
router.get('/recipes/:id', getRecipeById);
router.post('/recipes', createRecipe);
router.post('/recipes/save', savedRecipe);

export default router; 