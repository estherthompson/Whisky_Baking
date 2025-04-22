import express from 'express';
import { getTotalUsers, getTotalAdmins, getTotalRecipes, getPendingRecipes, approveRecipe, checkRecipeTable, rejectRecipe, getTableInfo } from '../controllers/adminController.js';

const router = express.Router();

router.get('/total-users', getTotalUsers);
router.get('/total-admins', getTotalAdmins);
router.get('/total-recipes', getTotalRecipes);
router.get('/pending-recipes', getPendingRecipes);
router.put('/recipes/:recipeId/approve', approveRecipe);
router.delete('/recipes/:recipeId', rejectRecipe);
router.get('/debug/recipe-table', checkRecipeTable);
router.get('/debug/table/:tableName', getTableInfo);

export default router; 