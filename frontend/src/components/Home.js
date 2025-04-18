import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/Home.css';

const API_BASE_URL = 'http://localhost:5001/api';

const Home = () => {
  const [recipes, setRecipes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    dietary: [],
    time: null,
    difficulty: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRecipes();
  }, [searchQuery, filters]);

  const fetchRecipes = async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query parameters
      const params = new URLSearchParams();
      if (searchQuery) {
        params.append('search', searchQuery);
      }
      if (filters.dietary.length > 0) {
        params.append('dietary', filters.dietary.join(','));
      }

      const response = await axios.get(`${API_BASE_URL}/recipes?${params}`);
      setRecipes(response.data);
    } catch (error) {
      console.error('Error fetching recipes:', error);
      setError('Failed to fetch recipes. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchRecipes();
  };

  const RecipeCard = ({ recipe }) => (
    <div className="recipe-card">
      <div className="recipe-image">
        <img src={recipe.image_url || '/placeholder-recipe.jpg'} alt={recipe.name} />
        <button className="save-button">
          <i className="far fa-bookmark"></i>
        </button>
      </div>
      <div className="recipe-info">
        <h3>{recipe.name}</h3>
        <p>{recipe.description}</p>
        <div className="recipe-meta">
          <span><i className="far fa-clock"></i> {recipe.recipetime} mins</span>
          <span className="rating">
            <i className="fas fa-star"></i>
            {recipe.rating || 'N/A'}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="home">
      <div className="banner">
        <div className="search-container">
          <form onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="Baking is Whisky Business"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <button type="submit" className="search-button">
              <i className="fas fa-search"></i>
            </button>
          </form>
        </div>
      </div>

      <div className="content">
        <section className="filters">
          <h2>Filters</h2>
          <div className="filter-group">
            <h3>Dietary Restrictions</h3>
            <div className="checkbox-group">
              {['Gluten Free', 'Vegan', 'Vegetarian', 'Dairy Free', 'Nut Free'].map(restriction => (
                <label key={restriction}>
                  <input
                    type="checkbox"
                    checked={filters.dietary.includes(restriction.toLowerCase())}
                    onChange={(e) => {
                      const value = restriction.toLowerCase();
                      setFilters(prev => ({
                        ...prev,
                        dietary: e.target.checked
                          ? [...prev.dietary, value]
                          : prev.dietary.filter(d => d !== value)
                      }));
                    }}
                  />
                  {restriction}
                </label>
              ))}
            </div>
          </div>
        </section>

        <section className="popular-recipes">
          <h2>Popular Recipes</h2>
          {error && <div className="error-message">{error}</div>}
          {loading ? (
            <div className="loading">Loading recipes...</div>
          ) : (
            <div className="recipe-grid">
              {recipes.map(recipe => (
                <RecipeCard key={recipe.recipeid} recipe={recipe} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Home; 