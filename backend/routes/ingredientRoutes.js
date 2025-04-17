import express from 'express';
import { 
    getIngredients, 
    getIngredientById, 
    createIngredient, 
    getRecipeIngredients 
} from '../controllers/ingredientController.js';

const router = express.Router();

// Ingredient routes
router.get('/ingredients', getIngredients);
router.get('/ingredients/:id', getIngredientById);
router.post('/ingredients', createIngredient);

// Recipe-Ingredient relationship routes
router.get('/recipes/:recipeId/ingredients', getRecipeIngredients);

export default router; 