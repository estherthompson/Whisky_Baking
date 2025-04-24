import express from 'express';
import { login, signup, deleteAccount, changePassword, debugUserAccount, testPasswordUpdate } from '../controllers/authController.js';

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.delete('/user/:userId', deleteAccount);
router.put('/user/:userId/password', changePassword);
router.get('/debug/user-account', debugUserAccount);
router.post('/test/password-update', testPasswordUpdate);

export default router; 