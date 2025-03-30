import React, { useEffect, useState } from 'react';
import { getStudents } from './api.js'; // Import the API call

function App() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);  // Add error state to show if any error occurs

  useEffect(() => {
    // Fetch students data when the component mounts
    const fetchStudents = async () => {
      try {
        const data = await getStudents();
        if (data && data.length > 0) {
          setStudents(data);  // Set students if data is available
        } else {
          setError('No students found');  // Handle empty data case
        }
      } catch (error) {
        console.error('Error loading students:', error);
        setError('Failed to load students');  // Handle errors in API call
      } finally {
        setLoading(false);  // Set loading to false after fetch completes
      }
    };

    fetchStudents();
  }, []);

  return (
    <div className="App">
      <h1>Students List</h1>
      {loading ? (
        <p>Loading...</p>  // Display loading state
      ) : error ? (
        <p>{error}</p>  // Display error if something goes wrong
      ) : (
        <ul>
          {students.map((student, index) => (
            <li key={index}>{student.name}</li>  // Display each student's name (assuming 'name' exists in your table)
          ))}
        </ul>
      )}
    </div>
  );
}

export default App;
