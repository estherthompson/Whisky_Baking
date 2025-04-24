import express from 'express';
import { login, signup, deleteAccount, changePassword } from '../controllers/authController.js';

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.delete('/user/:userId', deleteAccount);
router.put('/user/:userId/password', changePassword);


export default router; 