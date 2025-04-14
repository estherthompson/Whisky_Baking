import express from 'express';
import { getTotalUsers } from '../controllers/adminController.js';

const router = express.Router();

router.get('/total-users', getTotalUsers);

export default router; 