import express from 'express';
import { 
    getIngredients, 
    getIngredientById, 
    createIngredient, 
    getRecipeIngredients 
} from '../controllers/ingredientController.js';

const router = express.Router();

router.get('/ingredients', getIngredients);
router.get('/ingredients/:id', getIngredientById);
router.post('/ingredients', createIngredient);

router.get('/recipes/:recipeId/ingredients', getRecipeIngredients);

export default router; 