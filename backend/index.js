import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import profileRoutes from './routes/profileRoutes.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 5001;

// Use CORS middleware
app.use(cors());  // This will allow requests from any origin (i.e., from localhost:3000)

app.use(express.json());  // Middleware to parse JSON data
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});