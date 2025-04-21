import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import recipeRoutes from './routes/recipeRoutes.js';
import ingredientRoutes from './routes/ingredientRoutes.js';
import profileRoutes from './routes/profileRoutes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 5001;

// Use CORS middleware
app.use(cors());  // This will allow requests from any origin (i.e., from localhost:3000)

app.use(express.json({ limit: '50mb' }));  // Middleware to parse JSON data with a larger size limit for image uploads
app.use(express.urlencoded({ extended: true, limit: '50mb' })); // To parse form data with a larger size limit

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', recipeRoutes);
app.use('/api', ingredientRoutes);
app.use('/api', profileRoutes);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});