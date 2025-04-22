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
  const [ingredients, setIngredients] = useState([]);
  const [excludedIngredients, setExcludedIngredients] = useState({});
  const [dietaryRestrictions, setDietaryRestrictions] = useState([]);
  const [selectedRestrictions, setSelectedRestrictions] = useState({});
  const filterPanelRef = useRef(null);

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
        `);

      if (searchQuery) {
        query = query.ilike('name', `%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) {
        console.error('Supabase query error:', error);
        throw error;
      }

      console.log("data:", data)

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

      // Format the recipes with their ingredients and average rating
      const formattedRecipes = filteredRecipes.map(recipe => {
        // Calculate average rating
        let averageRating = 0;
        if (recipe.rating && recipe.rating.length > 0) {
          const totalRating = recipe.rating.reduce((sum, r) => sum + r.score, 0);
          averageRating = totalRating / recipe.rating.length;
        }

        return {
          ...recipe,
          username: recipe.user_account?.username || 'Unknown',
          ingredients: recipe.recipe_ingredient?.map(ri => ({
            name: ri.ingredient.name,
            quantity: ri.quantity
          })) || [],
          averageRating
        };
      });

      setRecipes(formattedRecipes);
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
        username: recipe.user_account?.username || 'Unknown',
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
              className="filter-button"
              onClick={() => setShowFilters(!showFilters)}
              aria-label="Filter recipes"
            >
              <FontAwesomeIcon icon={faFilter} />
            </button>
          </div>

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

      {(loading || recipes.length > 0) && (
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
                        <FontAwesomeIcon icon={faStar} /> {recipe.averageRating?.toFixed(1) || 'N/A'}
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
      )}

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