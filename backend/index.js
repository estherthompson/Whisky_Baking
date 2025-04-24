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

app.use(cors()); 

app.use(express.json({ limit: '50mb' }));  
app.use(express.urlencoded({ extended: true, limit: '50mb' })); 


app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', recipeRoutes);
app.use('/api', ingredientRoutes);
app.use('/api', profileRoutes);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});