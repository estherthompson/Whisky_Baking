import axios from 'axios';

const BASE_URL = 'http://localhost:5001/api'; 

// Exporting the axios instance to be used across the app
export const getStudents = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/students`);
    return response.data; // This should match the data returned by your backend
  } catch (error) {
    throw new Error('Error fetching students');
  }
};

