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
  faHistory,
  faTimes
} from '@fortawesome/free-solid-svg-icons';
import RecipeModal from './RecipeModal';

const UserAccount = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [user, setUser] = useState(() => {
    try {
      const userData = localStorage.getItem('user');
      if (!userData) {
        return null;
      }
      
      const parsedUser = JSON.parse(userData);
      return parsedUser;
    } catch (error) {
      console.error('Error parsing user data from localStorage:', error);
      return null;
    }
  });
  
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
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [formData, setFormData] = useState({
    bio: '',
    pronouns: '',
    personalLinks: ''
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);
  const [formError, setFormError] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);
  
  useEffect(() => {
    return () => {
      // Cleanup on unmount
    };
  }, []);

  useEffect(() => {
    if (!user) {
      return;
    }
    
    if (activeTab === 'my-recipes') {
      fetchUserRecipes();
    }
    
    if (activeTab === 'activity') {
      fetchUserActivities();
    }
    
    if (activeTab === 'saved') {
      setSavedRecipes([]);
      setSavedRecipesLoading(true);
      setTimeout(() => {
        fetchSavedRecipes();
      }, 100);
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'settings' && user) {
      fetchUserProfile();
    }
  }, [activeTab]);

  useEffect(() => {
    const handleRecipeSaved = (event) => {
      if (activeTab === 'saved') {
        fetchSavedRecipes();
      }
    };
    
    window.addEventListener('recipeSaved', handleRecipeSaved);
    
    return () => {
      window.removeEventListener('recipeSaved', handleRecipeSaved);
    };
  }, [activeTab]); 

  const fetchUserRecipes = async () => {
    if (!user) return;
    
    const userId = user.UserID || user.userid || user.userId || user.id;
    if (!userId) {
      console.error("Cannot find user ID in user object:", user);
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await axios.get(`http://localhost:5001/api/user/${userId}/recipes`);
      
      if (!Array.isArray(response.data)) {
        console.error("Expected array response but got:", typeof response.data);
        setMyRecipes([]);
        return;
      }
      
      const processedRecipes = response.data.map(recipe => {
        const imageUrl = recipe.imageUrl || recipe.imageurl || null;
        
        const processedRecipe = {
          ...recipe,
          imageurl: imageUrl,
          imageUrl: imageUrl,
          user_account: {
            username: recipe.username || user.username || 'Unknown'
          }
        };
        
        return processedRecipe;
      });
      
      setMyRecipes(processedRecipes);
      
      if (processedRecipes.length === 0) {
        return;
      }
      
      const detailedRecipes = await Promise.all(
        processedRecipes.map(async (recipe) => {
          try {
            const response = await axios.get(`http://localhost:5001/api/recipes/${recipe.recipeid}`);
            const detailedRecipe = response.data;
            
            let averageRating = detailedRecipe.averageRating;
            if (!averageRating && detailedRecipe.ratings && detailedRecipe.ratings.length > 0) {
              const totalRating = detailedRecipe.ratings.reduce((sum, rating) => sum + rating.score, 0);
              averageRating = (totalRating / detailedRecipe.ratings.length).toFixed(1);
            }
            
            return {
              ...recipe,
              ...detailedRecipe,
              imageurl: detailedRecipe.imageurl || detailedRecipe.imageUrl || recipe.imageUrl || recipe.imageurl,
              imageUrl: detailedRecipe.imageurl || detailedRecipe.imageUrl || recipe.imageUrl || recipe.imageurl,
              averageRating: averageRating || recipe.averageRating || 'N/A',
              ratings: detailedRecipe.ratings || [],
              user_account: {
                username: recipe.username || recipe.user_account?.username || user.username || 'Unknown'
              }
            };
          } catch (error) {
            console.error(`Error fetching details for recipe ${recipe.recipeid}:`, error);
            return recipe;
          }
        })
      );
      
      setMyRecipes(detailedRecipes);
      
    } catch (error) {
      console.error('Error fetching user recipes:', error);
      console.error('Error details:', error.response?.data || error.message);
      setMyRecipes([]);
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
      const response = await axios.get(`http://localhost:5001/api/user/${userId}/ratings`);
      
      const realActivities = response.data.map(rating => ({
        id: rating.id || rating.rating_id,
        type: 'rating',
        recipe: {
          id: rating.recipe_id || rating.recipeid,
          name: rating.recipe_name || 'Unknown Recipe'
        },
        date: rating.created_at || rating.date || new Date().toISOString(),
        data: {
          score: rating.rating || rating.score || 0,
          review: rating.review || rating.comment || ''
        }
      }));
      
      setActivities([...realActivities]);
      setActivityLoading(false);
      
    } catch (error) {
      console.error('Error fetching user ratings:', error);
      setActivityLoading(false);
      
      setActivities([]);
    }
  };

  const handleRecipeClick = async (recipe) => {
    try {
      const response = await axios.get(`http://localhost:5001/api/recipes/${recipe.recipeid}`);
      
      const recipeData = response.data;
      
      const formattedRecipe = {
        ...recipeData,
        username: activeTab === 'my-recipes' ? user.username : (recipeData.username || 'Unknown'),
        user_account: {
          username: activeTab === 'my-recipes' ? user.username : (recipeData.username || 'Unknown')
        },
        name: recipeData.name,
        description: recipeData.description,
        recipetime: recipeData.recipetime,
        rating: recipeData.rating,
        ingredients: recipeData.ingredients || [],
        imageurl: recipeData.imageurl || recipe.imageurl || null
      };
      
      setSelectedRecipe(formattedRecipe);
    } catch (error) {
      console.error('Error fetching recipe details:', error);
      console.error('Error response:', error.response?.data);
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
      case 'viewed':
        return <FontAwesomeIcon icon={faHistory} />;
  
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
    if (!user) {
      console.error("No user object available");
      return;
    }
    
    const userId = user.UserID || user.userid || user.userId || user.id;
    
    if (!userId) {
      console.error("Cannot find user ID in user object:", user);

      const possibleIdProps = Object.keys(user).filter(key => 
        key.toLowerCase().includes('id') && user[key]
      );
      
      if (possibleIdProps.length > 0) {
        const fallbackId = user[possibleIdProps[0]];
        await fetchSavedRecipesWithId(fallbackId);
      } else {
        console.error("No valid user ID found, cannot fetch saved recipes");
        setSavedRecipes([]);
        setSavedRecipesLoading(false);
      }
      return;
    }
    
    await fetchSavedRecipesWithId(userId);
  };
  
  const fetchSavedRecipesWithId = async (userId) => {
    setSavedRecipesLoading(true);
    
    try {
      const url = `http://localhost:5001/api/user/${userId}/saved-recipes`;
      
      const response = await axios.get(url);
      
      if (!response.data.recipes || !Array.isArray(response.data.recipes)) {
        console.error("Expected recipes array in response but got:", response.data);
        setSavedRecipes([]);
        return;
      }
      
      const processedRecipes = response.data.recipes.map(recipe => {
        const imageUrl = recipe.imageUrl || recipe.imageurl;
        return {
          ...recipe,
          imageurl: imageUrl,
          imageUrl: imageUrl
        };
      });
      
      setSavedRecipes(processedRecipes);
      
      Promise.all(
        processedRecipes.map(recipe => 
          axios.get(`http://localhost:5001/api/recipes/${recipe.recipeid}`)
            .then(response => {
              return {
                ...recipe,
                ...response.data,
                dateSaved: recipe.dateSaved, 
                imageurl: response.data.imageurl || response.data.imageUrl || recipe.imageUrl || recipe.imageurl,
                imageUrl: response.data.imageurl || response.data.imageUrl || recipe.imageUrl || recipe.imageurl
              };
            })
            .catch(error => {
              console.error(`Error fetching details for recipe ${recipe.recipeid}:`, error);
              return recipe; 
            })
        )
      ).then(detailedRecipes => {
        setSavedRecipes(detailedRecipes);
      });
      
    } catch (error) {
      console.error('Error fetching saved recipes:', error);
      console.error('Error details:', error.response?.data || error.message);
      setSavedRecipes([]);
    } finally {
      setSavedRecipesLoading(false);
    }
  };

  const fetchUserProfile = async () => {
    if (!user) return;
    
    const userId = user.UserID || user.userid || user.userId || user.id;
    if (!userId) {
      console.error("Cannot find user ID in user object:", user);
      return;
    }
    
    setProfileLoading(true);
    
    try {
      const response = await axios.get(`http://localhost:5001/api/user/${userId}/profile`);
      setProfile(response.data);

      setFormData({
        bio: response.data.bio || '',
        pronouns: response.data.pronouns || '',
        personalLinks: '' 
      });
      
      if (response.data.imageurl) {
        setImagePreview(response.data.imageurl);
      }
    } catch (error) {
      if (error.response && error.response.status === 404) {
        // Profile not found, will create new one on save
      } else {
        console.error('Error fetching user profile:', error);
      }
    } finally {
      setProfileLoading(false);
    }
  };

  const handleProfileChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) return;
    
    const userId = user.UserID || user.userid || user.userId || user.id;
    if (!userId) {
      setFormError('User ID not found');
      return;
    }
    
    setFormSubmitting(true);
    setFormError('');
    
    try {
      let response;
      
      if (profile) {
        response = await axios.put(`http://localhost:5001/api/user/${userId}/profile`, {
          bio: formData.bio,
          pronouns: formData.pronouns,
          imageUrl: profile.imageurl 
        });
      } else {
        response = await axios.post('http://localhost:5001/api/profile', {
          userId,
          username: user.username,
          bio: formData.bio,
          pronouns: formData.pronouns
        });
      }
      
      setProfile(response.data);
      setFormSuccess(true);
      
      setTimeout(() => {
        setFormSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Error saving profile:', error);
      setFormError(error.response?.data?.error || 'Error saving profile');
    } finally {
      setFormSubmitting(false);
    }
  };


  const handleImageUpload = async (file) => {
    if (!user || !file) return;
    
    const userId = user.UserID || user.userid || user.userId || user.id;
    if (!userId) {
      console.error("Cannot find user ID in user object:", user);
      return;
    }
    
    const reader = new FileReader();
    
    reader.onloadend = async () => {
      try {
        const base64File = reader.result;
        
        const response = await axios.post(`http://localhost:5001/api/user/${userId}/profile/image`, {
          file: base64File
        });
        
        if (response.data.imageUrl) {
          setImagePreview(response.data.imageUrl);
          
          if (profile) {
            setProfile({
              ...profile,
              imageurl: response.data.imageUrl
            });
          }
        }
      } catch (error) {
        console.error('Error uploading image:', error);
        alert('Failed to upload image. Please try again.');
      }
    };
    
    reader.readAsDataURL(file);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      
      handleImageUpload(file);
    }
  };

  const removeSavedRecipe = async (recipeId, event) => {
    // Prevent the click event from bubbling up to the parent card
    event.stopPropagation();
    
    if (!user) {
      console.error("Cannot remove recipe: No user logged in");
      alert('Please log in to remove saved recipes');
      return;
    }
    
    const userId = user.UserID || user.userid || user.userId || user.id;
    if (!userId) {
      console.error("Cannot find user ID in user object", user);
      alert('User ID not found. Please try logging out and back in.');
      return;
    }
    
    console.log(`Attempting to remove saved recipe ${recipeId} for user ${userId}`);
    
    // Immediately update UI for better user experience
    const originalRecipes = [...savedRecipes];
    setSavedRecipes(savedRecipes.filter(recipe => recipe.recipeid !== recipeId));
    
    try {
      // Use the POST method with _method=DELETE for compatibility with servers that don't support DELETE
      const response = await axios({
        method: 'POST',
        url: `http://localhost:5001/api/user/${userId}/saved-recipes/${recipeId}`,
        headers: {
          'Content-Type': 'application/json',
          'X-HTTP-Method-Override': 'DELETE'
        }
      });
      
      console.log('Delete response:', response.data);
      
      // Feedback was already provided by optimistically updating the UI
    } catch (error) {
      console.error('Error removing saved recipe:', error);
      console.error('Error details:', error.response?.data || error.message);
      
      // Revert the UI change on error
      setSavedRecipes(originalRecipes);
      
      // Show error message
      alert(`Failed to remove recipe: ${error.response?.data?.error || error.message}. Please try again.`);
    }
  };

  if (!user) {
    return null;
  }

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    
    navigate('/login');
  };

  const isAdmin = user.isadmin;

  const renderStarRating = (rating) => {
    if (!rating || rating === 'N/A' || rating === 0 || rating === '0') {
      return <span className="unrated"><FontAwesomeIcon icon={faStar} /> Unrated</span>;
    }
    
    const ratingNum = parseFloat(rating);
    return (
      <span className="star-rating">
        <FontAwesomeIcon icon={faStar} className="star-filled" />
        <span className="rating-value">{ratingNum.toFixed(1)}</span>
      </span>
    );
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    
    // Find the user ID - we need to make sure it's properly extracted
    const possibleIdFields = ['UserID', 'userid', 'userId', 'id'];
    let userId = null;
    
    for (const field of possibleIdFields) {
      if (user[field] !== undefined && user[field] !== null) {
        userId = user[field];
        break;
      }
    }
    
    if (!userId) {
      console.error("Cannot find valid user ID in user object:", user);
      setDeleteError('User ID not found. Please try logging out and back in.');
      return;
    }
    
    console.log("Found user ID for deletion:", userId, "with type:", typeof userId);
    
    setDeleteLoading(true);
    setDeleteError('');
    
    try {
      console.log('Attempting to delete account for user ID:', userId);
      
      const response = await axios({
        method: 'DELETE',
        url: `http://localhost:5001/api/auth/user/${userId}`
      });
      
      console.log('Account deletion response:', response.data);
      
      // Clear local storage and redirect to login page
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      
      // Redirect to login page with message
      navigate('/login', { state: { message: 'Your account has been successfully deleted.' } });
      
    } catch (error) {
      console.error('Error deleting account:', error);
      console.error('Error response:', error.response);
      
      let errorMessage = 'An error occurred while deleting your account. Please try again.';
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.status === 404) {
        errorMessage = 'Account not found. It may have already been deleted.';
      } else if (error.response?.status === 400) {
        errorMessage = 'Invalid request. Please try logging out and back in.';
      }
      
      setDeleteError(errorMessage);
      setDeleteLoading(false);
    }
  };

  const confirmDeleteAccount = () => {
    setDeleteModalOpen(true);
  };

  const cancelDeleteAccount = () => {
    setDeleteModalOpen(false);
    setDeleteError('');
  };

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
          <button 
            className={`tab ${activeTab === 'saved' ? 'active' : ''}`}
            onClick={() => setActiveTab('saved')}
          >
            <img src={savedIcon} alt="Saved" className="icon" />
            <span className="text">Saved Recipes</span>
          </button>
          {!isAdmin && (
          <button 
              className={`tab ${activeTab === 'activity' ? 'active' : ''}`}
              onClick={() => setActiveTab('activity')}
          >
              <img src={activityIcon} alt="Activity" className="icon" />
              <span className="text">Activity</span>
          </button>
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
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleRecipeClick(recipe);
                      }
                    }}
                  >
                    <div className="recipe-image">
                      {(() => {
                        const imageUrl = recipe.imageUrl || recipe.imageurl;
                        
                        if (imageUrl) {
                          return (
                            <img 
                              src={imageUrl}
                              alt={recipe.name}
                              style={{width: '100%', height: '100%', objectFit: 'cover'}}
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = '/placeholder-recipe.jpg';
                              }}
                            />
                          );
                        } else {
                          return (
                            <div className="recipe-icon">
                              <FontAwesomeIcon icon={faUtensils} size="3x" />
                              <div className="no-image-text">No Images</div>
                            </div>
                          );
                        }
                      })()}
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
              <div className="no-recipes">
                <p>You haven't created any recipes yet.</p>
                <button className="create-recipe-btn" onClick={() => navigate('/upload-recipe')}>
                  Create Your First Recipe
                </button>
              </div>
            )}
          </div>
        )}
        {activeTab === 'saved' && (
          <div className="saved-recipes">
            <h2>Saved Recipes</h2>
            <div className="refresh-container">
              <button 
                className="refresh-button"
                onClick={fetchSavedRecipes}
                disabled={savedRecipesLoading}
              >
                {savedRecipesLoading ? 'Loading...' : 'Refresh Recipes'}
              </button>
            </div>
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
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleRecipeClick(recipe);
                      }
                    }}
                  >
                    <div className="recipe-image">
                      {(() => {
                        const imageUrl = recipe.imageUrl || recipe.imageurl;
                        
                        if (imageUrl) {
                          return (
                            <img 
                              src={imageUrl}
                              alt={recipe.name}
                              style={{width: '100%', height: '100%', objectFit: 'cover'}}
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = '/placeholder-recipe.jpg';
                              }}
                            />
                          );
                        } else {
                          return (
                            <div className="recipe-icon">
                              <FontAwesomeIcon icon={faUtensils} size="3x" />
                              <div className="no-image-text">No Images</div>
                            </div>
                          );
                        }
                      })()}
                      <button 
                        className="remove-saved-btn"
                        onClick={(e) => removeSavedRecipe(recipe.recipeid, e)}
                        aria-label="Remove from saved recipes"
                      >
                        <FontAwesomeIcon icon={faTimes} />
                      </button>
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
                className={`filter-button ${activityFilter === 'viewed' ? 'active' : ''}`}
                onClick={() => setActivityFilter('viewed')}
          >
                Recently Viewed
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
                          <span 
                            className="activity-recipe-link" 
                            onClick={() => handleRecipeClick({ recipeid: activity.recipe?.id || activity.recipe_id })}
                          >
                            {activity.recipe?.name || activity.recipe_name || 'Unknown Recipe'}
                          </span>
                        </h3>
                        <span className="activity-date">{formatDate(activity.date || activity.created_at)}</span>
                      </div>
                      <p className="activity-text">
                        {activity.type === 'rating' && 
                          `You rated ${activity.recipe?.name || activity.recipe_name} ${activity.data?.score || activity.rating} stars${activity.data?.review || activity.review ? `: "${activity.data?.review || activity.review}"` : ''}`
                        }
                        {activity.type === 'viewed' &&
                          `You viewed ${activity.recipe?.name || activity.recipe_name}`
                        }
                        {activity.type === 'creation' && 
                          `You created a new recipe: ${activity.recipe?.name || activity.recipe_name}`
                        }
                        {activity.type === 'save' && 
                          `You saved ${activity.recipe?.name || activity.recipe_name} to your collection`
                        }
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
                {profileLoading ? (
                  <div className="loading">Loading your profile...</div>
                ) : (
                  <form className="profile-form" onSubmit={handleProfileSubmit}>
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
                      <input 
                        type="text" 
                        id="pronouns" 
                        name="pronouns" 
                        placeholder="Enter your pronouns"
                        value={formData.pronouns}
                        onChange={handleProfileChange}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="bio">Bio</label>
                      <textarea 
                        id="bio" 
                        name="bio" 
                        placeholder="Tell us about yourself"
                        value={formData.bio}
                        onChange={handleProfileChange}
                      ></textarea>
                    </div>
                    {formError && <div className="error-message">{formError}</div>}
                    {formSuccess && <div className="success-message">Profile updated successfully!</div>}
                    <button 
                      type="submit" 
                      className="save-btn"
                      disabled={formSubmitting}
                    >
                      {formSubmitting ? 'Saving...' : 'Save Changes'}
                    </button>
                  </form>
                )}
              </div>
              <div className="settings-section">
                <h3>Account Management</h3>
                <div className="account-actions">
                  <button className="action-btn change-password-btn">Change Password</button>
                  <button className="action-btn delete-account-btn" onClick={confirmDeleteAccount}>Delete Account</button>
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

      {/* Delete Account Confirmation Modal */}
      {deleteModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content delete-modal">
            <h2>Delete Account</h2>
            <p>Are you sure you want to delete your account? This action cannot be undone.</p>
            <p>All your recipes, ratings, and saved content will be permanently deleted.</p>
            
            {deleteError && <div className="error-message">{deleteError}</div>}
            
            <div className="modal-actions">
              <button 
                className="cancel-btn" 
                onClick={cancelDeleteAccount}
                disabled={deleteLoading}
              >
                Cancel
              </button>
              <button 
                className="delete-btn" 
                onClick={handleDeleteAccount}
                disabled={deleteLoading}
              >
                {deleteLoading ? 'Deleting...' : 'Yes, Delete My Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserAccount; 