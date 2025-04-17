import express from 'express';
import { getIngredients, createRecipe } from '../controllers/recipeController.js';

const router = express.Router();

router.get('/ingredients', getIngredients);
router.post('/recipes', createRecipe);

export default router; 