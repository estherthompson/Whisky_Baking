import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/UserManagement.css';

const UserManagement = () => {
  const [expandedRecipe, setExpandedRecipe] = useState(null);
  const [userCount, setUserCount] = useState(0);
  const [adminCount, setAdminCount] = useState(0);
  const [recipeCount, setRecipeCount] = useState(0);
  const [pendingRecipes, setPendingRecipes] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(false);
  
  // Fetch stats from API
  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch total users
        const usersResponse = await axios.get('http://localhost:5001/api/admin/total-users');
        console.log('Total users response:', usersResponse.data);
        if (usersResponse.data && usersResponse.data.totalUsers) {
          setUserCount(usersResponse.data.totalUsers);
        }
        
        // Fetch total admins
        const adminsResponse = await axios.get('http://localhost:5001/api/admin/total-admins');
        console.log('Total admins response:', adminsResponse.data);
        if (adminsResponse.data && adminsResponse.data.totalAdmins) {
          setAdminCount(adminsResponse.data.totalAdmins);
        }

        // Fetch total recipes
        const recipesResponse = await axios.get('http://localhost:5001/api/admin/total-recipes');
        console.log('Total recipes response:', recipesResponse.data);
        if (recipesResponse.data && recipesResponse.data.totalRecipes) {
          setRecipeCount(recipesResponse.data.totalRecipes);
        }
        
        // Fetch pending recipes
        fetchPendingRecipes();
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();
  }, []);
  
  // Fetch pending recipes
  const fetchPendingRecipes = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:5001/api/admin/pending-recipes');
      console.log('Pending recipes:', response.data);
      
      if (response.data && response.data.recipes) {
        setPendingRecipes(response.data.recipes);
        setPendingCount(response.data.recipes.length);
      }
    } catch (error) {
      console.error('Error fetching pending recipes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRecipe = async (recipeId) => {
    try {
      const response = await axios.put(`http://localhost:5001/api/admin/recipes/${recipeId}/approve`);
      console.log('Recipe approved:', response.data);
      
      // Refresh the pending recipes
      fetchPendingRecipes();
    } catch (error) {
      console.error('Error approving recipe:', error);
    }
  };
  
  const toggleRecipeDetails = (recipeId) => {
    setExpandedRecipe(expandedRecipe === recipeId ? null : recipeId);
  };

  return (
    <div className="user-management">
      {/* Stats Section */}
      <div className="stats-section">
        <div className="stat-card">
          <h3>Users</h3>
          <p className="stat-number">{userCount}</p>
        </div>
        <div className="stat-card">
          <h3>Pending Recipes</h3>
          <p className="stat-number">{pendingCount}</p>
        </div>
        <div className="stat-card">
          <h3>Recipes</h3>
          <p className="stat-number">{recipeCount}</p>
        </div>
        <div className="stat-card">
          <h3>Admins</h3>
          <p className="stat-number">{adminCount}</p>
        </div>
      </div>
      
      {/* Recipes Section */}
      <div className="recipes-section">
        <h2>Recipe Approval Management</h2>
        
        <div className="users-card-container">
          {loading ? (
            <div className="loading">Loading pending recipes...</div>
          ) : pendingRecipes && pendingRecipes.length > 0 ? (
            pendingRecipes.map(recipe => (
              <div key={recipe.recipeid} className="user-card">
                <div 
                  className="user-header"
                  onClick={() => toggleRecipeDetails(recipe.recipeid)}
                >
                  <div className="user-name">{recipe.name || 'Unnamed Recipe'}</div>
                  <div className="user-status">
                    <span className="status-badge pending">Pending Approval</span>
                  </div>
                </div>
                
                {expandedRecipe === recipe.recipeid && (
                  <div className="user-details">
                    <div className="recipe-content">
                      <div className="recipe-info-grid">
                        <div className="recipe-info-item">
                          <strong>Recipe ID:</strong> {recipe.recipeid}
                        </div>
                        <div className="recipe-info-item">
                          <strong>User ID:</strong> {recipe.userid || 'Unknown'}
                        </div>
                        <div className="recipe-info-item">
                          <strong>Prep Time:</strong> {recipe.recipetime || 'Not specified'} minutes
                        </div>
                      </div>

                      <h3 className="recipe-section-title">Description</h3>
                      <div className="recipe-description">{recipe.description || 'No description available'}</div>
                      
                      <h3 className="recipe-section-title">Ingredients</h3>
                      <div className="recipe-ingredients">
                        {recipe.ingredients ? (
                          <ul className="ingredients-list">
                            {Array.isArray(recipe.ingredients) ? (
                              recipe.ingredients.map((ingredient, index) => (
                                <li key={index}>{typeof ingredient === 'object' ? ingredient.name || JSON.stringify(ingredient) : ingredient}</li>
                              ))
                            ) : typeof recipe.ingredients === 'object' ? (
                              Object.entries(recipe.ingredients).map(([key, value], index) => (
                                <li key={index}>{typeof value === 'object' ? value.name || JSON.stringify(value) : value}</li>
                              ))
                            ) : (
                              <li>Ingredients format not recognized</li>
                            )}
                          </ul>
                        ) : (
                          <p>No ingredients information available</p>
                        )}
                      </div>
                      
                      <h3 className="recipe-section-title">Instructions</h3>
                      <div className="recipe-instructions">
                        {recipe.instructions ? (
                          <div>
                            {Array.isArray(recipe.instructions) ? (
                              <ol className="instructions-list">
                                {recipe.instructions.map((step, index) => (
                                  <li key={index}>{step}</li>
                                ))}
                              </ol>
                            ) : (
                              <p>{recipe.instructions}</p>
                            )}
                          </div>
                        ) : (
                          <p>No instructions available</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="user-actions">
                      <button 
                        className="approve-btn"
                        onClick={() => handleApproveRecipe(recipe.recipeid)}
                      >
                        Approve Recipe
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="no-pending">
              <p>No pending recipes found</p>
              <p>Recipes pending approval will appear here</p>
              <button onClick={fetchPendingRecipes} className="refresh-btn">
                Refresh
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserManagement; 