import React, { useState, useEffect, useRef } from 'react';
import '../styles/Home.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSearch, 
  faFilter,
  faStar,
  faClock,
  faUtensils
} from '@fortawesome/free-solid-svg-icons';
import bakingBackground from '../assets/images/baking-background.jpg';
import { supabase } from '../supabaseClient';

const Home = () => {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dietaryRestrictions, setDietaryRestrictions] = useState([]);
  const [filters, setFilters] = useState({
    dietary: {},
    prepTime: 'all',
    rating: 'all'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const filterPanelRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterPanelRef.current && !filterPanelRef.current.contains(event.target)) {
        setShowFilters(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    fetchDietaryRestrictions();
    fetchRecipes();
  }, []);

  const fetchDietaryRestrictions = async () => {
    try {
      const { data, error } = await supabase
        .from('dietary_restrictions')
        .select('*');
      
      if (error) throw error;
      
      setDietaryRestrictions(data);
      const dietaryFilters = {};
      data.forEach(restriction => {
        dietaryFilters[restriction.id] = false;
      });
      setFilters(prev => ({
        ...prev,
        dietary: dietaryFilters
      }));
    } catch (error) {
      console.error('Error fetching dietary restrictions:', error);
    }
  };

  const handleSearch = () => {
    fetchRecipes();
    setShowFilters(false);
  };

  const fetchRecipes = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('recipe')
        .select('*');

      if (searchQuery) {
        query = query.ilike('name', `%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) {
        console.error('Supabase query error:', error);
        throw error;
      }
      
      console.log('Raw recipe data:', data);
      console.log('Number of recipes:', data?.length || 0);
      setRecipes(data || []);
    } catch (error) {
      console.error('Error fetching recipes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (category, value) => {
    setFilters(prev => ({
      ...prev,
      [category]: category === 'dietary' 
        ? { ...prev.dietary, [value]: !prev.dietary[value] }
        : value
    }));
  };

  return (
    <div className="home-container">
      <div 
        className="hero-banner"
        style={{ backgroundImage: `url(${bakingBackground})` }}
      >
        <div className="search-container">
          <div className="search-bar">
            <FontAwesomeIcon icon={faSearch} className="search-icon" />
            <input
              type="text"
              placeholder="Baking is Whisk-y Business"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button 
              className="filter-button"
              onClick={() => setShowFilters(!showFilters)}
              aria-label="Filter recipes"
            >
              <FontAwesomeIcon icon={faFilter} />
            </button>
          </div>

          {showFilters && (
            <div className="filters-panel" ref={filterPanelRef}>
              <div className="filter-section">
                <h3>Dietary Restrictions</h3>
                <div className="dietary-options">
                  {dietaryRestrictions.map((restriction) => (
                    <label key={restriction.id}>
                      <input
                        type="checkbox"
                        checked={filters.dietary[restriction.id] || false}
                        onChange={() => handleFilterChange('dietary', restriction.id)}
                      />
                      {restriction.name}
                    </label>
                  ))}
                </div>
              </div>

              <div className="filter-section">
                <h3>Preparation Time</h3>
                <select
                  value={filters.prepTime}
                  onChange={(e) => handleFilterChange('prepTime', e.target.value)}
                >
                  <option value="all">Any Time</option>
                  <option value="under30">Under 30 minutes</option>
                  <option value="30to60">30-60 minutes</option>
                  <option value="over60">Over 60 minutes</option>
                </select>
              </div>

              <div className="filter-section">
                <h3>Rating</h3>
                <select
                  value={filters.rating}
                  onChange={(e) => handleFilterChange('rating', e.target.value)}
                >
                  <option value="all">All Ratings</option>
                  <option value="4">4+ Stars</option>
                  <option value="3">3+ Stars</option>
                  <option value="2">2+ Stars</option>
                </select>
              </div>

              <button className="search-button" onClick={handleSearch}>
                Search
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="content-section">
        <h2 className="section-title">Popular Recipes</h2>
        {loading ? (
          <div className="loading">Loading recipes...</div>
        ) : recipes.length > 0 ? (
          <div className="recipe-grid">
            {recipes.map((recipe) => (
              <div key={recipe.recipeid} className="recipe-card">
                <div className="recipe-image">
                  {recipe.imageurl ? (
                    <img 
                      src={recipe.imageurl} 
                      alt={recipe.name}
                      onError={(e) => {
                        console.log('Image failed to load:', recipe.imageurl);
                        e.target.onerror = null;
                        e.target.src = '/placeholder-recipe.jpg';
                      }}
                    />
                  ) : (
                    <div className="recipe-icon">
                      <FontAwesomeIcon icon={faUtensils} size="3x" />
                    </div>
                  )}
                </div>
                <div className="recipe-info">
                  <h3 className="recipe-name">{recipe.name || 'Untitled Recipe'}</h3>
                  <div className="recipe-meta">
                    <span className="prep-time">
                      <FontAwesomeIcon icon={faClock} /> {recipe.recipetime || 'N/A'} min
                    </span>
                    <span className="rating">
                      <FontAwesomeIcon icon={faStar} /> {recipe.average_rating || 'N/A'}
                    </span>
                  </div>
                  <p className="recipe-description">{recipe.description || 'No description available'}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-results">No recipes found. Try adjusting your search or filters.</div>
        )}
      </div>
    </div>
  );
};

export default Home; 