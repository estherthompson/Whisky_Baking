import axios from 'axios';

// Base URL of your backend (the server running on localhost or deployed)
const BASE_URL = 'http://localhost:5001/api'; // Adjust if your backend is running on a different port

// Exporting the axios instance to be used across the app
export const getStudents = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/students`);
    return response.data; // This should match the data returned by your backend
  } catch (error) {
    throw new Error('Error fetching students');
  }
};

