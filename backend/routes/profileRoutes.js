import express from 'express';
import multer from 'multer';
import { uploadProfilePhoto, getProfile, getProfileById, updateProfile } from '../controllers/profileController.js';

const router = express.Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Upload profile photo
router.post('/upload-photo', upload.single('photo'), uploadProfilePhoto);

// Get current user's profile
router.get('/', getProfile);

// Get profile by user ID
router.get('/:userid', getProfileById);

// Update profile
router.put('/', updateProfile);

export default router; 