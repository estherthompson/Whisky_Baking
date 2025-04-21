import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import '../styles/UserAccount.css';
import adminIcon from '../assets/icons/admin.svg';
import recipeIcon from '../assets/icons/recipes.svg';
import savedIcon from '../assets/icons/saved.svg';
import activityIcon from '../assets/icons/activity.svg';
import settingsIcon from '../assets/icons/settings.svg';
import defaultProfileImage from '../assets/images/login-image.png';
import UserManagement from './UserManagement';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faStar, 
  faClock, 
  faUtensils, 
  faComment, 
  faPlus, 
  faBookmark,
  faHistory
} from '@fortawesome/free-solid-svg-icons';
import RecipeModal from './RecipeModal';

const UserAccount = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user'));
  
  // Use activeTab from location state if provided, otherwise default to 'my-recipes'
  const [activeTab, setActiveTab] = useState(location.state?.activeTab || 'my-recipes');
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [imagePreview, setImagePreview] = useState(user?.profileImage || defaultProfileImage);
  const [myRecipes, setMyRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [activities, setActivities] = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityFilter, setActivityFilter] = useState('all');
  const [savedRecipes, setSavedRecipes] = useState([]);
  const [savedRecipesLoading, setSavedRecipesLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  // Fetch user recipes when the component mounts or when activeTab changes to 'my-recipes'
  useEffect(() => {
    if (activeTab === 'my-recipes' && user) {
      console.log("Full user object from localStorage:", user);
      console.log("User ID property name check:", {
        UserID: user.UserID,
        userid: user.userid,
        userId: user.userId,
        user_id: user.user_id
      });
      fetchUserRecipes();
    }
    
    if (activeTab === 'activity' && user) {
      fetchUserActivities();
    }
  }, [activeTab]);

  const fetchUserRecipes = async () => {
    if (!user) return;
    
    // Try to get userId from the various possible property names
    const userId = user.UserID || user.userid || user.userId || user.id;
    if (!userId) {
      console.error("Cannot find user ID in user object:", user);
      return;
    }
    
    console.log("Fetching recipes for user ID:", userId);
    setLoading(true);
    
    try {
      // Try the debug endpoint first to see what works
      const debugResponse = await axios.get(`http://localhost:5001/api/debug/user/${userId}/recipes`);
      console.log("Debug API response:", debugResponse.data);
      
      // Use the regular endpoint to get the actual recipes
      const response = await axios.get(`http://localhost:5001/api/user/${userId}/recipes`);
      console.log("Received recipes:", response.data);
      
      setMyRecipes(response.data);
      
      if (response.data.length === 0) {
        console.log("No recipes found for this user");
      }
    } catch (error) {
      console.error('Error fetching user recipes:', error);
      console.log("Error response:", error.response?.data);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserActivities = async () => {
    if (!user) return;
    
    const userId = user.UserID || user.userid || user.userId || user.id;
    if (!userId) {
      console.error("Cannot find user ID in user object:", user);
      return;
    }
    
    setActivityLoading(true);
    
    try {
      
      const mockActivities = [
        {
          id: 1,
          type: 'rating',
          recipe: {
            id: 6,
            name: 'Walnut Brownies'
          },
          date: '2023-12-01T15:30:00',
          data: {
            score: 4.5,
            review: 'These brownies were delicious! The walnuts added a perfect crunch.'
          }
        },
        {
          id: 2,
          type: 'creation',
          recipe: {
            id: 6,
            name: 'Walnut Brownies'
          },
          date: '2023-11-29T10:15:00',
          data: {
            description: 'Fudgy brownies with crunchy walnuts for added texture and flavor.'
          }
        },
        {
          id: 3,
          type: 'save',
          recipe: {
            id: 5,
            name: 'Chocolate Chip Cookies'
          },
          date: '2023-11-28T18:20:00',
          data: {}
        },
        {
          id: 4,
          type: 'comment',
          recipe: {
            id: 4,
            name: 'Vanilla Cake'
          },
          date: '2023-11-25T14:10:00',
          data: {
            comment: 'I tried this recipe with almond extract instead of vanilla and it was amazing!'
          }
        }
      ];
      
      setTimeout(() => {
        setActivities(mockActivities);
        setActivityLoading(false);
      }, 500); // Simulate network delay
      
    } catch (error) {
      console.error('Error fetching user activities:', error);
      setActivityLoading(false);
    }
  };

  const handleRecipeClick = async (recipe) => {
    try {
      const response = await axios.get(`http://localhost:5001/api/recipes/${recipe.recipeid}`);
      setSelectedRecipe(response.data);
    } catch (error) {
      console.error('Error fetching recipe details:', error);
    }
  };

  const filterActivities = (activities, filter) => {
    if (filter === 'all') return activities;
    return activities.filter(activity => activity.type === filter);
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'rating':
        return <FontAwesomeIcon icon={faStar} />;
      case 'comment':
        return <FontAwesomeIcon icon={faComment} />;
      case 'creation':
        return <FontAwesomeIcon icon={faPlus} />;
      case 'save':
        return <FontAwesomeIcon icon={faBookmark} />;
      default:
        return <FontAwesomeIcon icon={faHistory} />;
    }
  };

  const getActivityText = (activity) => {
    switch (activity.type) {
      case 'rating':
        return `You rated ${activity.recipe.name} ${activity.data.score} stars: "${activity.data.review}"`;
      case 'comment':
        return `You commented on ${activity.recipe.name}: "${activity.data.comment}"`;
      case 'creation':
        return `You created a new recipe: ${activity.recipe.name}`;
      case 'save':
        return `You saved ${activity.recipe.name} to your collection`;
      default:
        return `You interacted with ${activity.recipe.name}`;
    }
  };

  const fetchSavedRecipes = async () => {
    if (!user) return;
    
    // Use the same approach as fetchUserRecipes
    const userId = user.UserID || user.userid || user.userId || user.id;
    if (!userId) {
      console.error("Cannot find user ID in user object:", user);
      return;
    }
    
    console.log("Fetching saved recipes for user ID:", userId);
    setSavedRecipesLoading(true);
    
    try {
      const response = await axios.get(`http://localhost:5001/api/user/${userId}/saved-recipes`);
      console.log('Saved recipes:', response.data);
      setSavedRecipes(response.data.recipes || []);
    } catch (error) {
      console.error('Error fetching saved recipes:', error);
    } finally {
      setSavedRecipesLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'recipes') {
      fetchUserRecipes();
    } else if (activeTab === 'activity') {
      fetchUserActivities();
    } else if (activeTab === 'saved') {
      fetchSavedRecipes();
    }
  }, [activeTab]);

  if (!user) {
    return null;
  }

  const handleLogout = () => {
    // Clear user data from localStorage
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    
    // Redirect to login page
    navigate('/login');
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const isAdmin = user.isadmin;

  return (
    <div className="user-account-container">
      <div className="tabs-container">
        <div className="tabs">
          {isAdmin && (
            <button
              className={`tab ${activeTab === 'admin' ? 'active' : ''}`}
              onClick={() => setActiveTab('admin')}
            >
              <img src={adminIcon} alt="Admin" className="icon" />
              <span className="text">Admin Dashboard</span>
            </button>
          )}
          <button
            className={`tab ${activeTab === 'my-recipes' ? 'active' : ''}`}
            onClick={() => setActiveTab('my-recipes')}
          >
            <img src={recipeIcon} alt="My Recipes" className="icon" />
            <span className="text">My Recipes</span>
          </button>
          {!isAdmin && (
            <>
              <button
                className={`tab ${activeTab === 'saved' ? 'active' : ''}`}
                onClick={() => setActiveTab('saved')}
              >
                <img src={savedIcon} alt="Saved" className="icon" />
                <span className="text">Saved Recipes</span>
              </button>
              <button
                className={`tab ${activeTab === 'activity' ? 'active' : ''}`}
                onClick={() => setActiveTab('activity')}
              >
                <img src={activityIcon} alt="Activity" className="icon" />
                <span className="text">Activity</span>
              </button>
            </>
          )}
          <button
            className={`tab ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <img src={settingsIcon} alt="Settings" className="icon" />
            <span className="text">Settings</span>
          </button>
        </div>
      </div>

      <div className="tab-content">
        {isAdmin && activeTab === 'admin' && (
          <div className="admin-dashboard">
            <h2>Admin Dashboard</h2>
            <UserManagement setShowUserManagement={setShowUserManagement} />
          </div>
        )}
        {activeTab === 'my-recipes' && (
          <div className="my-recipes">
            <h2>My Recipes</h2>
            {loading ? (
              <div className="loading">Loading your recipes...</div>
            ) : myRecipes.length > 0 ? (
              <div className="recipe-grid">
                {myRecipes.map((recipe) => (
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
                      {recipe.image_url ? (
                        <img 
                          src={recipe.image_url} 
                          alt={recipe.name}
                          onError={(e) => {
                            console.log('Image failed to load:', recipe.image_url);
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
                          <FontAwesomeIcon icon={faStar} /> {recipe.rating || 'N/A'}
                        </span>
                      </div>
                      <p className="recipe-description">{recipe.description || 'No description available'}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-recipes">
                <p>You haven't created any recipes yet.</p>
                <button className="create-recipe-btn" onClick={() => navigate('/upload-recipe')}>
                  Create Your First Recipe
                </button>
              </div>
            )}
          </div>
        )}
        {!isAdmin && activeTab === 'saved' && (
          <div className="saved-recipes">
            <h2>Saved Recipes</h2>
            {savedRecipesLoading ? (
              <div className="loading">Loading your saved recipes...</div>
            ) : savedRecipes.length > 0 ? (
              <div className="recipe-grid">
                {savedRecipes.map((recipe) => (
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
                      {recipe.image_url ? (
                        <img 
                          src={recipe.image_url} 
                          alt={recipe.name}
                          onError={(e) => {
                            console.log('Image failed to load:', recipe.image_url);
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
                        <span className="saved-date">
                          <FontAwesomeIcon icon={faBookmark} /> {recipe.dateSaved ? new Date(recipe.dateSaved).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                      <p className="recipe-description">{recipe.description?.substring(0, 100) || 'No description available'}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-recipes">
                <p>You haven't saved any recipes yet.</p>
                <button className="create-recipe-btn" onClick={() => navigate('/')}>
                  Explore Recipes
                </button>
              </div>
            )}
          </div>
        )}
        {!isAdmin && activeTab === 'activity' && (
          <div className="activity">
            <h2>Your Activity</h2>
            
            <div className="activity-filter">
              <button 
                className={`filter-button ${activityFilter === 'all' ? 'active' : ''}`}
                onClick={() => setActivityFilter('all')}
              >
                All Activity
              </button>
              <button 
                className={`filter-button ${activityFilter === 'rating' ? 'active' : ''}`}
                onClick={() => setActivityFilter('rating')}
              >
                Ratings
              </button>
              <button 
                className={`filter-button ${activityFilter === 'comment' ? 'active' : ''}`}
                onClick={() => setActivityFilter('comment')}
              >
                Comments
              </button>
              <button 
                className={`filter-button ${activityFilter === 'creation' ? 'active' : ''}`}
                onClick={() => setActivityFilter('creation')}
              >
                Creations
              </button>
              <button 
                className={`filter-button ${activityFilter === 'save' ? 'active' : ''}`}
                onClick={() => setActivityFilter('save')}
              >
                Saved
              </button>
            </div>
            
            {activityLoading ? (
              <div className="loading">Loading your activity...</div>
            ) : filterActivities(activities, activityFilter).length > 0 ? (
              <div className="activity-list">
                {filterActivities(activities, activityFilter).map((activity) => (
                  <div key={activity.id} className="activity-item">
                    <div className={`activity-icon ${activity.type}`}>
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="activity-content">
                      <div className="activity-header">
                        <h3 className="activity-title">
                          <span className="activity-recipe-link" onClick={() => handleRecipeClick({ recipeid: activity.recipe.id })}>
                            {activity.recipe.name}
                          </span>
                        </h3>
                        <span className="activity-date">{formatDate(activity.date)}</span>
                      </div>
                      <p className="activity-text">
                        {getActivityText(activity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-activity">
                <p>No activity found. Start interacting with recipes to see your activity here!</p>
              </div>
            )}
          </div>
        )}
        {activeTab === 'settings' && (
          <div className="settings">
            <h2>Settings</h2>
            <div className="settings-sections">
              <div className="settings-section">
                <h3>Profile Information</h3>
                <form className="profile-form">
                  <div className="form-group">
                    <label htmlFor="profile_image">Profile Image</label>
                    <div className="profile-image-container">
                      <img 
                        src={imagePreview} 
                        alt="Profile" 
                        className="profile-image-preview" 
                      />
                    </div>
                    <input 
                      type="file" 
                      id="profile_image" 
                      name="profile_image" 
                      accept="image/*" 
                      onChange={handleImageChange}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="username">Username</label>
                    <input type="text" id="username" name="username" value={user.username} readOnly />
                  </div>
                  <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input type="email" id="email" name="email" value={user.email} readOnly />
                  </div>
                  <div className="form-group">
                    <label htmlFor="pronouns">Pronouns</label>
                    <input type="text" id="pronouns" name="pronouns" placeholder="Enter your pronouns" />
                  </div>
                  <div className="form-group">
                    <label htmlFor="bio">Bio</label>
                    <textarea id="bio" name="bio" placeholder="Tell us about yourself"></textarea>
                  </div>
                  <div className="form-group">
                    <label htmlFor="personal_links">Personal Links</label>
                    <input type="url" id="personal_links" name="personal_links" placeholder="Enter your personal links" />
                  </div>
                  <button type="submit" className="save-btn">Save Changes</button>
                </form>
              </div>
              <div className="settings-section">
                <h3>Notification Preferences</h3>
                <form className="notifications-form">
                  <div className="checkbox-group">
                    <input type="checkbox" id="email_notifications" name="email_notifications" />
                    <label htmlFor="email_notifications">Email Notifications</label>
                    <p className="description">Receive emails about new recipe comments, likes, and follows.</p>
                  </div>
                  <div className="checkbox-group">
                    <input type="checkbox" id="recipe_updates" name="recipe_updates" />
                    <label htmlFor="recipe_updates">Recipe Updates</label>
                    <p className="description">Get notified when recipes you've saved are updated.</p>
                  </div>
                  <div className="checkbox-group">
                    <input type="checkbox" id="newsletter" name="newsletter" />
                    <label htmlFor="newsletter">Weekly Newsletter</label>
                    <p className="description">Receive our weekly newsletter with trending recipes and cooking tips.</p>
                  </div>
                  <button type="submit" className="save-btn">Save Preferences</button>
                </form>
              </div>
              <div className="settings-section">
                <h3>Privacy Settings</h3>
                <form className="privacy-form">
                  <div className="checkbox-group">
                    <input type="checkbox" id="public_profile" name="public_profile" />
                    <label htmlFor="public_profile">Public Profile</label>
                    <p className="description">Allow other users to view your profile and recipes.</p>
                  </div>
                  <div className="checkbox-group">
                    <input type="checkbox" id="show_activity" name="show_activity" />
                    <label htmlFor="show_activity">Show Activity</label>
                    <p className="description">Show your activity (likes, comments) to other users.</p>
                  </div>
                  <button type="submit" className="save-btn">Save Privacy Settings</button>
                </form>
              </div>
              <div className="settings-section">
                <h3>Account Management</h3>
                <div className="account-actions">
                  <button className="action-btn change-password-btn">Change Password</button>
                  <button className="action-btn delete-account-btn">Delete Account</button>
                </div>
              </div>
            </div>
            <button className="logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>
        )}
      </div>

      {selectedRecipe && (
        <RecipeModal
          recipe={selectedRecipe}
          onClose={() => setSelectedRecipe(null)}
        />
      )}
    </div>
  );
};

export default UserAccount; 