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
import homeBanner from '../assets/images/home-banner.jpg';
import { supabase } from '../supabaseClient';
import RecipeModal from './RecipeModal';

const Home = () => {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [excludedIngredients, setExcludedIngredients] = useState({
    'eggs': true,
    'milk': true,
    'butter': true,
    'flour': true,
    'sugar': true,
    'baking powder': true,
    'salt': true,
    'vanilla extract': true,
    'chocolate': true,
    'nuts': true,
    'fruit': true,
    'vegetables': true,
    'cream': true,
    'yeast': true,
    'cinnamon': true,
    'honey': true
  });
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

  const handleIngredientToggle = (ingredient) => {
    setExcludedIngredients(prev => ({
      ...prev,
      [ingredient]: !prev[ingredient]
    }));
  };

  const fetchRecipes = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('recipe')
        .select(`
          *,
          recipe_ingredient (
            ingredient (
              name,
              ingredientid
            ),
            quantity
          )
        `);

      if (searchQuery) {
        query = query.ilike('name', `%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) {
        console.error('Supabase query error:', error);
        throw error;
      }

      // Filter out recipes that contain excluded ingredients
      const uncheckedIngredients = Object.entries(excludedIngredients)
        .filter(([_, isChecked]) => !isChecked)  // Get unchecked ingredients
        .map(([ingredient]) => ingredient.toLowerCase());

      // If no ingredients are unchecked, show all recipes
      const filteredRecipes = uncheckedIngredients.length === 0
        ? data // Show all recipes if no ingredients are unchecked
        : data.filter(recipe => {
            const recipeIngredients = recipe.recipe_ingredient?.map(ri => 
              ri.ingredient.name.toLowerCase()
            ) || [];
            
            // Filter out recipes that contain any unchecked ingredients
            return !uncheckedIngredients.some(unchecked => 
              recipeIngredients.some(ingredient => 
                ingredient.includes(unchecked)
              )
            );
          });

      // Format the recipes with their ingredients
      const formattedRecipes = filteredRecipes.map(recipe => ({
        ...recipe,
        ingredients: recipe.recipe_ingredient?.map(ri => ({
          name: ri.ingredient.name,
          quantity: ri.quantity
        })) || []
      }));

      setRecipes(formattedRecipes);
    } catch (error) {
      console.error('Error fetching recipes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecipes();
  }, [excludedIngredients]); // Fetch recipes when excluded ingredients change

  const handleRecipeClick = async (recipe) => {
    console.log('Recipe clicked:', recipe);
    
    // First set the basic recipe data to show the modal immediately
    setSelectedRecipe({
      ...recipe,
      ingredients: [] // Will be populated after fetch
    });
    
    try {
      // Then fetch the complete details
      const { data, error } = await supabase
        .from('recipe')
        .select(`
          *,
          recipe_ingredient!inner (
            ingredient!inner (
              name,
              ingredientid
            ),
            quantity
          )
        `)
        .eq('recipeid', recipe.recipeid)
        .single();

      if (error) {
        console.error('Error fetching recipe:', error);
        return;
      }

      if (!data) {
        console.error('No recipe data returned');
        return;
      }

      // Update the recipe with full details
      const formattedRecipe = {
        ...data,
        ingredients: data.recipe_ingredient.map(ri => ({
          name: ri.ingredient.name,
          quantity: ri.quantity
        }))
      };

      console.log('Setting full recipe data:', formattedRecipe);
      setSelectedRecipe(formattedRecipe);
    } catch (error) {
      console.error('Error in handleRecipeClick:', error);
    }
  };

  return (
    <div className="home-container">
      <div 
        className="hero-banner"
        style={{ backgroundImage: `url(${homeBanner})` }}
      >
        <h1 className="hero-title">Baking is Whisk-Y Business</h1>
        <div className="search-container">
          <div className="search-bar">
            <FontAwesomeIcon icon={faSearch} className="search-icon" />
            <input
              type="text"
              placeholder="Search recipes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && fetchRecipes()}
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
              <h2>Exclude Ingredients</h2>
              <div className="ingredients-grid">
                {Object.keys(excludedIngredients).map((ingredient) => (
                  <label 
                    key={ingredient} 
                    className="ingredient-checkbox"
                    data-ingredient={ingredient.toLowerCase()}
                  >
                    <input
                      type="checkbox"
                      checked={excludedIngredients[ingredient]}
                      onChange={() => handleIngredientToggle(ingredient)}
                    />
                    {ingredient.charAt(0).toUpperCase() + ingredient.slice(1)}
                  </label>
                ))}
              </div>
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
              <div 
                key={recipe.recipeid} 
                className="recipe-card"
                onClick={() => handleRecipeClick(recipe)}
                style={{ cursor: 'pointer' }}
                role="button"
                tabIndex={0}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleRecipeClick(recipe);
                  }
                }}
              >
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

      {selectedRecipe && (
        <RecipeModal
          recipe={selectedRecipe}
          onClose={() => {
            console.log('Closing modal');
            setSelectedRecipe(null);
          }}
        />
      )}
    </div>
  );
};

export default Home; 