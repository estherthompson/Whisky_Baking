import express from 'express';
import { getStudents } from '../controllers/studentController.js';  // Ensure you use .js for the controller import

const router = express.Router();

// Define the route for getting all students
router.get('/students', getStudents);

export default router;
