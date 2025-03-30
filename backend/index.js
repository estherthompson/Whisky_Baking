import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import studentRoutes from './routes/studentRoutes.js';  // Correctly import routes

dotenv.config();

const app = express();
const port = process.env.PORT || 5001;

// Use CORS middleware
app.use(cors());  // This will allow requests from any origin (i.e., from localhost:3000)

app.use(express.json());  // Middleware to parse JSON data
app.use('/api', studentRoutes);  // Use the routes for all /api/* paths

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});