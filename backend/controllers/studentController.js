import supabase from '../config/supabaseClient.js';

const getStudents = async (req, res) => {
  // Fetching all students from the "students" table
  const { data, error } = await supabase
    .from('students')  // Ensure your table is named 'students'
    .select('*');      // Select all columns

  if (error) {
    // Return 500 status code if there is an error
    return res.status(500).json({ error: error.message });
  }

  if (data.length === 0) {
    // Optional: Handle the case when no data is found
    return res.status(404).json({ message: 'No students found' });
  }

  // Return the fetched data (students)
  res.json(data);
};

export { getStudents };
