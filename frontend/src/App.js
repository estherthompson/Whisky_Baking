import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './components/Home';
import RecipeDetail from './components/RecipeDetail';
import './styles/global.css';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/recipe/:recipeId" element={<RecipeDetail />} />
          {/* Add more routes here as needed */}
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
