import React, { useState, useEffect, useRef } from 'react';
import '../styles/Home.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSearch, 
  faFilter,
  faStar,
  faClock,
  faUtensils,
  faAppleWhole 
} from '@fortawesome/free-solid-svg-icons';
import homeBanner from '../assets/images/home-banner.jpg';
import { supabase } from '../supabaseClient';
import RecipeModal from './RecipeModal';
import { useLocation } from 'react-router-dom';

const Home = () => {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [showAvailableIngredients, setShowAvailableIngredients] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [ingredientSearchQuery, setIngredientSearchQuery] = useState('');
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [ingredients, setIngredients] = useState([]);
  const [excludedIngredients, setExcludedIngredients] = useState({});
  const [dietaryRestrictions, setDietaryRestrictions] = useState([]);
  const [selectedRestrictions, setSelectedRestrictions] = useState({});
  const [availableIngredients, setAvailableIngredients] = useState({});
  const [allIngredients, setAllIngredients] = useState([]);
  const filterPanelRef = useRef(null);
  const availableIngredientsRef = useRef(null);
  const location = useLocation();

  // Fetch all ingredients and dietary restrictions from the database
  const fetchIngredients = async () => {
    try {
      // Fetch ingredients
      const { data: ingredientData, error: ingredientError } = await supabase
        .from('ingredient')
        .select('ingredientid, name, dietary_restriction_ingredient(dietary_restriction(name))')
        .order('name');

      if (ingredientError) throw ingredientError;

      // Initialize excludedIngredients state with all ingredients unchecked
      const initialExcludedState = ingredientData.reduce((acc, ingredient) => {
        acc[ingredient.name] = true;
        return acc;
      }, {});

      setIngredients(ingredientData);
      setExcludedIngredients(initialExcludedState);

      // Fetch dietary restrictions
      const { data: restrictionData, error: restrictionError } = await supabase
        .from('dietary_restriction')
        .select('*')
        .order('name');

      if (restrictionError) throw restrictionError;

      // Initialize selectedRestrictions state with all restrictions unchecked
      const initialRestrictionsState = restrictionData.reduce((acc, restriction) => {
        acc[restriction.name] = false;
        return acc;
      }, {});

      setDietaryRestrictions(restrictionData);
      setSelectedRestrictions(initialRestrictionsState);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    fetchIngredients();
  }, []);

  const handleIngredientToggle = (ingredient) => {
    setExcludedIngredients(prev => ({
      ...prev,
      [ingredient]: !prev[ingredient]
    }));
  };

  const handleRestrictionToggle = (restrictionName) => {
    setSelectedRestrictions(prev => ({
      ...prev,
      [restrictionName]: !prev[restrictionName]
    }));

    // Get ingredients associated with this restriction
    const restrictedIngredients = ingredients.filter(ingredient => 
      ingredient.dietary_restriction_ingredient?.some(dri => 
        dri.dietary_restriction.name === restrictionName
      )
    ).map(ingredient => ingredient.name);

    // Update excluded ingredients based on the restriction
    setExcludedIngredients(prev => {
      const newState = { ...prev };
      restrictedIngredients.forEach(ingredient => {
        newState[ingredient] = false;
      });
      return newState;
    });
  };

  const renderStarRating = (rating) => {
    if (!rating || rating === 'N/A') {
      return <span><FontAwesomeIcon icon={faStar} /> N/A</span>;
    }
    
    const ratingNum = parseFloat(rating);
    return (
      <span className="star-rating">
        <FontAwesomeIcon icon={faStar} className="star-filled" />
        <span className="rating-value">{ratingNum.toFixed(1)}</span>
      </span>
    );
  };

  const fetchRecipes = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('recipe')
        .select(`
          *,
          user_account:userid (
            username
          ),
          recipe_ingredient (
            ingredient (
              name,
              ingredientid
            ),
            quantity
          ),
          rating (
            score
          )
        `)
        .eq('is_approved', true);

      if (searchQuery) {
        query = query.ilike('name', `%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) {
        console.error('Supabase query error:', error);
        throw error;
      }

      console.log("Raw recipe data:", data); // Debug log

      // Filter out recipes that contain excluded ingredients
      const uncheckedIngredients = Object.entries(excludedIngredients)
        .filter(([_, isChecked]) => !isChecked)
        .map(([ingredient]) => ingredient.toLowerCase());

      // If no ingredients are unchecked, show all recipes
      let filteredRecipes = uncheckedIngredients.length === 0
        ? data
        : data.filter(recipe => {
            const recipeIngredients = recipe.recipe_ingredient?.map(ri => 
              ri.ingredient.name.toLowerCase()
            ) || [];
            
            return !uncheckedIngredients.some(unchecked => 
              recipeIngredients.some(ingredient => 
                ingredient.includes(unchecked)
              )
            );
          });

      // Filter recipes based on selected available ingredients
      const selectedIngredients = Object.entries(availableIngredients)
        .filter(([_, isSelected]) => isSelected)
        .map(([name]) => name.toLowerCase());

        if (selectedIngredients.length > 0) {
          filteredRecipes = filteredRecipes.filter(recipe => {
            const recipeIngredients = recipe.recipe_ingredient?.map(ri =>
              ri.ingredient.name.toLowerCase()
            ) || [];
        
            // true only if every recipe ingredient is in selectedIngredients
            return recipeIngredients.every(ingredient =>
              selectedIngredients.includes(ingredient)
            );
          });
        }

      // Format the recipes with their ingredients and average rating
      const formattedRecipes = filteredRecipes.map(recipe => {
        // Calculate average rating
        let averageRating = 0;
        if (recipe.rating && recipe.rating.length > 0) {
          const totalRating = recipe.rating.reduce((sum, r) => sum + r.score, 0);
          averageRating = totalRating / recipe.rating.length;
        }

        // Get the username from user_account
        const username = recipe.user_account?.name || recipe.user_account?.username || 'Unknown';
        console.log("Recipe:", recipe.name, "Username:", username); // Debug log

        return {
          ...recipe,
          username: username,
          ingredients: recipe.recipe_ingredient?.map(ri => ({
            name: ri.ingredient.name,
            quantity: ri.quantity
          })) || [],
          averageRating
        };
      });

      console.log("Formatted recipes:", formattedRecipes); // Debug log
      const sortedRecipes = formattedRecipes.sort((a, b) => b.averageRating - a.averageRating);
      setRecipes(sortedRecipes);
    } catch (error) {
      console.error('Error fetching recipes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (ingredients.length > 0) {
      fetchRecipes();
    }
  }, [excludedIngredients, ingredients]);

  const handleRecipeClick = async (recipe) => {
    console.log('Recipe clicked:', recipe);
    
    // First set the basic recipe data to show the modal immediately
    setSelectedRecipe({
      ...recipe,
      username: recipe.user_account?.username || 'Unknown',
      ingredients: [] // Will be populated after fetch
    });
    
    try {
      // Then fetch the complete details
      const { data, error } = await supabase
        .from('recipe')
        .select(`
          *,
          user_account:userid (
            username
          ),
          recipe_ingredient!inner (
            ingredient!inner (
              name,
              ingredientid
            ),
            quantity
          ),
          rating (
            ratingid,
            score,
            reviewtext,
            dateposted,
            user_account (
              name
            )
          )
        `)
        .eq('recipeid', recipe.recipeid)
        .eq('is_approved', true)
        .single();

      if (error) {
        console.error('Error fetching recipe:', error);
        return;
      }

      if (!data) {
        console.error('No recipe data returned');
        return;
      }

      // Calculate average rating
      let averageRating = 0;
      if (data.rating && data.rating.length > 0) {
        const totalRating = data.rating.reduce((sum, r) => sum + r.score, 0);
        averageRating = totalRating / data.rating.length;
      }

      // Update the recipe with full details
      const formattedRecipe = {
        ...data,
        username: data.user_account?.name || data.user_account?.username || 'Unknown',
        ingredients: data.recipe_ingredient.map(ri => ({
          name: ri.ingredient.name,
          quantity: ri.quantity
        })),
        ratings: data.rating || [],
        averageRating
      };

      console.log('Setting full recipe data:', formattedRecipe);
      setSelectedRecipe(formattedRecipe);
    } catch (error) {
      console.error('Error in handleRecipeClick:', error);
    }
  };

  // Effect to handle opening recipe modal from navigation state
  useEffect(() => {
    if (location.state?.openRecipeId) {
      const recipeId = location.state.openRecipeId;
      const recipe = recipes.find(r => r.recipeid === recipeId);
      if (recipe) {
        console.log('Opening recipe modal with draft review:', location.state.draftReview);
        handleRecipeClick(recipe);
      }
    }
  }, [location.state, recipes]);

  useEffect(() => {
    // Fetch all ingredients from the database
    const fetchAllIngredients = async () => {
      try {
        const { data, error } = await supabase
          .from('ingredient')
          .select('ingredientid, name')
          .order('name');

        if (error) throw error;

        // Initialize availableIngredients state with all ingredients unchecked
        const initialAvailableState = data.reduce((acc, ingredient) => {
          acc[ingredient.name] = false;
          return acc;
        }, {});

        setAllIngredients(data);
        setAvailableIngredients(initialAvailableState);
      } catch (error) {
        console.error('Error fetching ingredients:', error);
      }
    };

    fetchAllIngredients();
  }, []);

  const toggleIngredient = (ingredientName) => {
    setAvailableIngredients(prev => ({
      ...prev,
      [ingredientName]: !prev[ingredientName]
    }));
  };

  const clearIngredients = () => {
    const clearedState = Object.keys(availableIngredients).reduce((acc, key) => {
      acc[key] = false;
      return acc;
    }, {});
    setAvailableIngredients(clearedState);
    setIngredientSearchQuery(''); // Clear the search input
    fetchRecipes();
  };

  const filteredIngredients = allIngredients.filter(ingredient =>
    ingredient.name.toLowerCase().includes(ingredientSearchQuery.toLowerCase())
  );

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
                onKeyDown={(e) => e.key === 'Enter' && fetchRecipes()}
              />
              <button 
                className="available-ingredients-button"
                onClick={() => setShowAvailableIngredients(!showAvailableIngredients)}
                aria-label="Available ingredients"
              >
                <FontAwesomeIcon icon={faAppleWhole} />
              </button>
              <button 
                className="filter-button"
                onClick={() => setShowFilters(showFilters => !showFilters)}
                aria-label="Filter recipes"
              >
                <FontAwesomeIcon icon={faFilter} />
              </button>
            </div>
          
          {showAvailableIngredients && (
            <div className="available-ingredients-panel" ref={availableIngredientsRef}>
              <p className="panel-description">
                Select ingredients you have at home
              </p>
              <div className="ingredient-search-container">
                <FontAwesomeIcon icon={faSearch} className="ingredient-search-icon" />
                <input
                  type="text"
                  className="ingredient-search-input"
                  placeholder="Search ingredients..."
                  value={ingredientSearchQuery}
                  onChange={(e) => setIngredientSearchQuery(e.target.value)}
                />
              </div>
              <div className="ingredients-grid">
                {filteredIngredients.map((ingredient) => (
                  <label 
                    key={ingredient.ingredientid} 
                    className="ingredient-checkbox available"
                    data-ingredient={ingredient.name.toLowerCase()}
                  >
                    <input
                      type="checkbox"
                      checked={availableIngredients[ingredient.name] || false}
                      onChange={() => toggleIngredient(ingredient.name)}
                    />
                    {ingredient.name}
                  </label>
                ))}
              </div>
              <div className="button-container">
                <button 
                  className="clear-button"
                  onClick={clearIngredients}
                >
                  Clear
                </button>
                <button 
                  className="done-button"
                  onClick={() => {
                    setShowAvailableIngredients(false)
                    fetchRecipes();
                    }}
                >
                  Done
                </button>
              </div>
            </div>
          )}
          
          {showFilters && (
            <div className="filters-panel" ref={filterPanelRef}>
              <div className="filters-section">
                <h2>Dietary Restrictions</h2>
                <div className="restrictions-grid">
                  {dietaryRestrictions.map((restriction) => (
                    <label 
                      key={restriction.restrictionid} 
                      className="restriction-checkbox"
                    >
                      <input
                        type="checkbox"
                        checked={selectedRestrictions[restriction.name]}
                        onChange={() => handleRestrictionToggle(restriction.name)}
                      />
                      {restriction.name}
                    </label>
                  ))}
                </div>
              </div>

              <div className="filters-section">
                <h2>Exclude Ingredients</h2>
                <div className="ingredients-grid">
                  {ingredients.map((ingredient) => (
                    <label 
                      key={ingredient.ingredientid} 
                      className="ingredient-checkbox"
                      data-ingredient={ingredient.name.toLowerCase()}
                    >
                      <input
                        type="checkbox"
                        checked={excludedIngredients[ingredient.name]}
                        onChange={() => handleIngredientToggle(ingredient.name)}
                      />
                      {ingredient.name}
                    </label>
                  ))}
                </div>
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
                        {renderStarRating(recipe.averageRating)}
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
          onClose={() => setSelectedRecipe(null)}
          initialShowReviewForm={!!location.state?.draftReview}
          draftReview={location.state?.draftReview}
        />
      )}
    </div>
  );
};

export default Home; 