import express from 'express';
import { getRecipes, getRecipeById, createRecipe, updateRecipe, deleteRecipe } from '../controllers/recipeController.js';

const router = express.Router();

// Recipe routes
router.get('/', getRecipes);
router.get('/:id', getRecipeById);
router.post('/', createRecipe);
router.put('/:id', updateRecipe);
router.delete('/:id', deleteRecipe);

export default router; 