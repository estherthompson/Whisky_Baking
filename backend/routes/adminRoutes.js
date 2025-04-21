import express from 'express';
import { getTotalUsers, getTotalAdmins,getTotalRecipes } from '../controllers/adminController.js';

const router = express.Router();

router.get('/total-users', getTotalUsers);
router.get('/total-admins', getTotalAdmins);
router.get('/total-recipes', getTotalRecipes);

export default router; 