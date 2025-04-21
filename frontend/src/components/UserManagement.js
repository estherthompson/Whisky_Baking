import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/UserManagement.css';

const UserManagement = () => {
  const [expandedUser, setExpandedUser] = useState(null);
  const [showUsersTable, setShowUsersTable] = useState(false);
  const [showRecipesTable, setShowRecipesTable] = useState(false);
  const [expandedRecipe, setExpandedRecipe] = useState(null);
  const [userCount, setUserCount] = useState(0);
  const [adminCount, setAdminCount] = useState(0);
  const [recipeCount, setRecipeCount] = useState(0);
  
  // Mock users data
  const [users] = useState([
    {
      id: 1,
      name: 'John Doe',
      username: 'johndoe',
      email: 'john@example.com',
      bio: 'Passionate baker and whisky enthusiast. Love experimenting with new recipes!',
      personalLinks: ['https://instagram.com/johndoe', 'https://twitter.com/johndoe'],
      isApproved: true,
      isAdmin: false
    },
    {
      id: 2,
      name: 'Jane Smith',
      username: 'janesmith',
      email: 'jane@example.com',
      bio: 'Professional pastry chef with 10 years of experience. Specializing in whisky-infused desserts.',
      personalLinks: ['https://instagram.com/janesmith', 'https://pinterest.com/janesmith'],
      isApproved: false,
      isAdmin: false
    },
    {
      id: 3,
      name: 'Admin User',
      username: 'admin',
      email: 'admin@example.com',
      bio: 'Site administrator and content moderator.',
      personalLinks: [],
      isApproved: true,
      isAdmin: true
    }
  ]);
  
  // Mock recipes data
  const [recipes] = useState([
    {
      id: 1,
      name: 'Whisky Brownie',
      author: 'John Doe',
      description: 'Rich chocolate brownies infused with premium whisky.',
      ingredients: ['Chocolate', 'Flour', 'Sugar', 'Eggs', 'Whisky'],
      isApproved: true
    },
    {
      id: 2,
      name: 'Bourbon Cake',
      author: 'Jane Smith',
      description: 'Moist vanilla cake with bourbon glaze.',
      ingredients: ['Flour', 'Sugar', 'Butter', 'Eggs', 'Bourbon'],
      isApproved: false
    },
    {
      id: 3,
      name: 'Scotch Cookies',
      author: 'John Doe',
      description: 'Buttery cookies with a hint of scotch.',
      ingredients: ['Flour', 'Butter', 'Sugar', 'Scotch'],
      isApproved: false
    }
  ]);

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
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();
  }, []);

  // Calculate stats
  const totalUsers = userCount || users.length;
  const pendingApprovals = users.filter(user => !user.isApproved).length;
  const totalAdmins = adminCount || users.filter(user => user.isAdmin).length;
  const totalRecipes = recipeCount || recipes.length;
  
  const handleApproveUser = (userId) => {
    console.log('Approve user:', userId);
  };

  const handleRejectUser = (userId) => {
    console.log('Reject user:', userId);
  };
  
  const handleApproveRecipe = (recipeId) => {
    console.log('Approve recipe:', recipeId);
  };

  const handleRejectRecipe = (recipeId) => {
    console.log('Reject recipe:', recipeId);
  };

  const toggleUserDetails = (userId) => {
    setExpandedUser(expandedUser === userId ? null : userId);
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
          <p className="stat-number">{totalUsers}</p>
        </div>
        <div className="stat-card">
          <h3>Pending</h3>
          <p className="stat-number">{pendingApprovals}</p>
        </div>
        <div className="stat-card">
          <h3>Recipes</h3>
          <p className="stat-number">{totalRecipes}</p>
        </div>
        <div className="stat-card">
          <h3>Admins</h3>
          <p className="stat-number">{totalAdmins}</p>
        </div>
      </div>

      {/* Users Dropdown Toggle */}
      <div className="users-dropdown-toggle first-dropdown" onClick={() => setShowUsersTable(!showUsersTable)}>
        <h3>User Management {showUsersTable ? '▲' : '▼'}</h3>
      </div>
      
      {/* Users Table (Collapsible) */}
      {showUsersTable && (
        <div className="users-card-container">
          {users.map(user => (
            <div key={user.id} className="user-card">
              <div 
                className="user-header"
                onClick={() => toggleUserDetails(user.id)}
              >
                <div className="user-name">{user.name}</div>
                <div className="user-status">
                  <span className={`status-badge ${user.isApproved ? 'approved' : 'pending'}`}>
                    {user.isApproved ? 'Approved' : 'Pending'}
                  </span>
                </div>
              </div>
              
              {expandedUser === user.id && (
                <div className="user-details">
                  <div className="user-email">{user.email}</div>
                  <div className="user-username">@{user.username}</div>
                  <div className="user-bio">{user.bio}</div>
                  <div className="user-links">
                    {user.personalLinks.length > 0 ? (
                      <ul>
                        {user.personalLinks.map((link, index) => (
                          <li key={index}>
                            <a href={link} target="_blank" rel="noopener noreferrer">
                              {link}
                            </a>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="no-links">No links provided</span>
                    )}
                  </div>
                  <div className="user-actions">
                    {!user.isApproved && (
                      <>
                        <button 
                          className="approve-btn"
                          onClick={() => handleApproveUser(user.id)}
                        >
                          Approve
                        </button>
                        <button 
                          className="reject-btn"
                          onClick={() => handleRejectUser(user.id)}
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      {/* Recipes Dropdown Toggle */}
      <div className="users-dropdown-toggle" onClick={() => setShowRecipesTable(!showRecipesTable)}>
        <h3>Recipe Management {showRecipesTable ? '▲' : '▼'}</h3>
      </div>
      
      {/* Recipes Table (Collapsible) */}
      {showRecipesTable && (
        <div className="users-card-container">
          {recipes.map(recipe => (
            <div key={recipe.id} className="user-card">
              <div 
                className="user-header"
                onClick={() => toggleRecipeDetails(recipe.id)}
              >
                <div className="user-name">{recipe.name}</div>
                <div className="user-status">
                  <span className={`status-badge ${recipe.isApproved ? 'approved' : 'pending'}`}>
                    {recipe.isApproved ? 'Approved' : 'Pending'}
                  </span>
                </div>
              </div>
              
              {expandedRecipe === recipe.id && (
                <div className="user-details">
                  <div className="recipe-author">By: {recipe.author}</div>
                  <div className="recipe-description">{recipe.description}</div>
                  <div className="recipe-ingredients">
                    <h4>Ingredients:</h4>
                    <ul>
                      {recipe.ingredients.map((ingredient, index) => (
                        <li key={index}>{ingredient}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="user-actions">
                    {!recipe.isApproved && (
                      <>
                        <button 
                          className="approve-btn"
                          onClick={() => handleApproveRecipe(recipe.id)}
                        >
                          Approve
                        </button>
                        <button 
                          className="reject-btn"
                          onClick={() => handleRejectRecipe(recipe.id)}
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserManagement; 