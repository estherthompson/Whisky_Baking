import express from 'express';
import { getTotalUsers, getTotalAdmins, getTotalRecipes, getPendingRecipes, approveRecipe } from '../controllers/adminController.js';

const router = express.Router();

router.get('/total-users', getTotalUsers);
router.get('/total-admins', getTotalAdmins);
router.get('/total-recipes', getTotalRecipes);
router.get('/pending-recipes', getPendingRecipes);
router.put('/recipes/:recipeId/approve', approveRecipe);

export default router; 