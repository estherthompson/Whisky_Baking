import express from 'express';
import { 
    getProfileByUserId, 
    createProfile, 
    updateProfile, 
    uploadProfileImage 
} from '../controllers/profileController.js';

const router = express.Router();

// Get profile by user ID
router.get('/user/:userId/profile', getProfileByUserId);

// Create new profile
router.post('/profile', createProfile);

// Update profile
router.put('/user/:userId/profile', updateProfile);

// Upload profile image
router.post('/user/:userId/profile/image', uploadProfileImage);

export default router; 