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

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

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
    
    if (activeTab === 'saved' && user) {
      fetchSavedRecipes();
    }
  }, [activeTab]);

  // Fetch user profile when the settings tab is active
  useEffect(() => {
    if (activeTab === 'settings' && user) {
      fetchUserProfile();
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
    
    console.log("=== BEGINNING USER RECIPES FETCH ===");
    console.log("Fetching recipes for user ID:", userId);
    setLoading(true);
    
    try {
      // Call the API to get the user's recipes
      console.log(`Calling API: http://localhost:5001/api/user/${userId}/recipes`);
      const response = await axios.get(`http://localhost:5001/api/user/${userId}/recipes`);
      
      console.log("API Response status:", response.status);
      console.log("Raw recipes data:", response.data);
      
      // Log the exact structure of the API response
      console.log("API Response stringified:", JSON.stringify(response.data));
      
      if (!Array.isArray(response.data)) {
        console.error("Expected array response but got:", typeof response.data);
        setMyRecipes([]);
        return;
      }
      
      // Process each recipe to ensure it has the necessary fields
      const processedRecipes = response.data.map(recipe => {
        // Inspect every property of the recipe object
        console.log(`RECIPE ${recipe.recipeid || 'unknown'} FULL DETAILS:`, recipe);
        console.log(`Recipe keys:`, Object.keys(recipe));
        
        // We found the issue! 
        // The backend controller uses 'imageUrl' (capital U) in the response
        // But the database field is 'imageurl' (lowercase u)
        // We need to explicitly check for both
        
        // Debug log each possible image URL field with its exact value
        console.log('Image URL debugging for recipe', recipe.recipeid, {
          'imageurl (lowercase)': recipe.imageurl,
          'imageUrl (capital U)': recipe.imageUrl,
          'imageURL (all caps)': recipe.imageURL
        });
        
        // Check for any property that might contain the image URL
        const allKeys = Object.keys(recipe);
        const imageKeys = allKeys.filter(key => 
          key.toLowerCase().includes('image') || 
          key.toLowerCase().includes('photo') || 
          key.toLowerCase().includes('picture')
        );
        
        if (imageKeys.length > 0) {
          console.log('Found potential image keys:', imageKeys);
          imageKeys.forEach(key => {
            console.log(`Value of ${key}:`, recipe[key]);
          });
        }
        
        // Select the image URL using the proper case from the controller response
        // The controller is returning 'imageUrl' with capital U
        const imageUrl = recipe.imageUrl || recipe.imageurl || null;
        
        console.log(`Selected image URL for recipe ${recipe.recipeid}:`, imageUrl);
        
        // Create a processed recipe that explicitly copies both versions of the field
        const processedRecipe = {
          ...recipe,
          // Ensure both lowercase and capital U versions are available
          imageurl: imageUrl,
          imageUrl: imageUrl,
          user_account: {
            username: recipe.username || user.username || 'Unknown'
          }
        };
        
        console.log(`Processed recipe ${recipe.recipeid} image fields:`, {
          original_imageurl: recipe.imageurl,
          original_imageUrl: recipe.imageUrl,
          normalized_imageurl: processedRecipe.imageurl,
          normalized_imageUrl: processedRecipe.imageUrl
        });
        
        return processedRecipe;
      });
      
      console.log("=== FINAL PROCESSED RECIPES ===");
      processedRecipes.forEach(recipe => {
        console.log(`Recipe ${recipe.recipeid}: ${recipe.name}, Image URL: ${recipe.imageUrl || recipe.imageurl || 'NONE'}`);
      });
      
      // Set the recipes first so we have something to display
      setMyRecipes(processedRecipes);
      
      if (processedRecipes.length === 0) {
        console.log("No recipes found for this user");
        return;
      }
      
      // Now fetch complete details for each recipe to ensure we have all fields including images
      console.log("Fetching complete details for each recipe to get images...");
      
      const detailedRecipes = await Promise.all(
        processedRecipes.map(async (recipe) => {
          try {
            // This is the same call that handleRecipeClick makes which loads the images correctly
            const response = await axios.get(`http://localhost:5001/api/recipes/${recipe.recipeid}`);
            const detailedRecipe = response.data;
            
            console.log(`Detailed recipe ${recipe.recipeid} data:`, {
              imageUrl: detailedRecipe.imageurl || detailedRecipe.imageUrl,
              ratings: detailedRecipe.ratings?.length || 0,
              averageRating: detailedRecipe.averageRating
            });
            
            // Calculate the average rating if needed
            let averageRating = detailedRecipe.averageRating;
            if (!averageRating && detailedRecipe.ratings && detailedRecipe.ratings.length > 0) {
              const totalRating = detailedRecipe.ratings.reduce((sum, rating) => sum + rating.score, 0);
              averageRating = (totalRating / detailedRecipe.ratings.length).toFixed(1);
            }
            
            // Combine the data, ensuring we have the image URL and ratings
            return {
              ...recipe,
              ...detailedRecipe,
              // Ensure both versions of image URL
              imageurl: detailedRecipe.imageurl || detailedRecipe.imageUrl || recipe.imageUrl || recipe.imageurl,
              imageUrl: detailedRecipe.imageurl || detailedRecipe.imageUrl || recipe.imageUrl || recipe.imageurl,
              // Ensure we have rating data
              averageRating: averageRating || recipe.averageRating || 'N/A',
              ratings: detailedRecipe.ratings || [],
              // Keep consistent user info
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
      
      console.log("Detailed recipes with images:", detailedRecipes);
      setMyRecipes(detailedRecipes);
      
    } catch (error) {
      console.error('Error fetching user recipes:', error);
      console.error('Error details:', error.response?.data || error.message);
      setMyRecipes([]);
    } finally {
      setLoading(false);
      console.log("=== END USER RECIPES FETCH ===");
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
      console.log('User ratings:', response.data);
      
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
      

      // Combine the real ratings with the mock viewed recipes
      setActivities([...realActivities]);
      setActivityLoading(false);
      
    } catch (error) {
      console.error('Error fetching user ratings:', error);
      setActivityLoading(false);
      
      // Fallback to empty array if the API call fails
      setActivities([]);
    }
  };

  const handleRecipeClick = async (recipe) => {
    console.log('Recipe clicked:', recipe);
    
    try {
      console.log(`Fetching details for recipe ID: ${recipe.recipeid}`);
      const response = await axios.get(`http://localhost:5001/api/recipes/${recipe.recipeid}`);
      console.log('Recipe details API response:', response.data);
      
      const recipeData = response.data;
      
      // Format the recipe to include user account information
      const formattedRecipe = {
        ...recipeData,
        username: activeTab === 'my-recipes' ? user.username : (recipeData.username || 'Unknown'),
        user_account: {
          username: activeTab === 'my-recipes' ? user.username : (recipeData.username || 'Unknown')
        },
        // Preserve the original recipe data
        name: recipeData.name,
        description: recipeData.description,
        recipetime: recipeData.recipetime,
        rating: recipeData.rating,
        ingredients: recipeData.ingredients || [],
        // Ensure image URL is properly set
        imageurl: recipeData.imageurl || recipe.imageurl || null
      };
      
      console.log('Formatted recipe for modal:', formattedRecipe);
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
    if (!user) return;
    
    // Use the same approach as fetchUserRecipes
    const userId = user.UserID || user.userid || user.userId || user.id;
    if (!userId) {
      console.error("Cannot find user ID in user object:", user);
      return;
    }
    
    console.log("=== BEGINNING SAVED RECIPES FETCH ===");
    console.log("Fetching saved recipes for user ID:", userId);
    setSavedRecipesLoading(true);
    
    try {
      const response = await axios.get(`http://localhost:5001/api/user/${userId}/saved-recipes`);
      console.log('Saved recipes API response:', response.data);
      
      if (!response.data.recipes || !Array.isArray(response.data.recipes)) {
        console.error("Expected recipes array in response but got:", response.data);
        setSavedRecipes([]);
        return;
      }
      
      // First set basic recipes data
      const initialSavedRecipes = response.data.recipes.map(recipe => {
        const imageUrl = recipe.imageUrl || recipe.imageurl;
        return {
          ...recipe,
          imageurl: imageUrl,
          imageUrl: imageUrl
        };
      });
      
      // Set initial data
      setSavedRecipes(initialSavedRecipes);
      
      if (initialSavedRecipes.length === 0) {
        console.log("No saved recipes found");
        return;
      }
      
      // Then fetch full details for each recipe to get ratings and images
      console.log("Fetching complete details for saved recipes...");
      
      const detailedRecipes = await Promise.all(
        initialSavedRecipes.map(async (recipe) => {
          try {
            const response = await axios.get(`http://localhost:5001/api/recipes/${recipe.recipeid}`);
            const detailedRecipe = response.data;
            
            console.log(`Detailed saved recipe ${recipe.recipeid} data:`, {
              imageUrl: detailedRecipe.imageurl || detailedRecipe.imageUrl,
              ratings: detailedRecipe.ratings?.length || 0,
              averageRating: detailedRecipe.averageRating
            });
            
            // Calculate the average rating if needed
            let averageRating = detailedRecipe.averageRating;
            if (!averageRating && detailedRecipe.ratings && detailedRecipe.ratings.length > 0) {
              const totalRating = detailedRecipe.ratings.reduce((sum, rating) => sum + rating.score, 0);
              averageRating = (totalRating / detailedRecipe.ratings.length).toFixed(1);
            }
            
            // Merge the detailed data with the saved recipe data
            return {
              ...recipe,
              ...detailedRecipe,
              // Keep the original date saved
              dateSaved: recipe.dateSaved,
              // Ensure both versions of image URL
              imageurl: detailedRecipe.imageurl || detailedRecipe.imageUrl || recipe.imageUrl || recipe.imageurl,
              imageUrl: detailedRecipe.imageurl || detailedRecipe.imageUrl || recipe.imageUrl || recipe.imageurl,
              // Ensure we have rating data
              averageRating: averageRating || 'N/A',
              ratings: detailedRecipe.ratings || []
            };
          } catch (error) {
            console.error(`Error fetching details for saved recipe ${recipe.recipeid}:`, error);
            return recipe;
          }
        })
      );
      
      console.log("=== DETAILED SAVED RECIPES ===");
      detailedRecipes.forEach(recipe => {
        console.log(`Saved recipe ${recipe.recipeid}: ${recipe.name}, Rating: ${recipe.averageRating}, Image URL: ${recipe.imageUrl || recipe.imageurl || 'NONE'}`);
      });
      
      setSavedRecipes(detailedRecipes);
    } catch (error) {
      console.error('Error fetching saved recipes:', error);
      console.error('Error details:', error.response?.data || error.message);
      setSavedRecipes([]);
    } finally {
      setSavedRecipesLoading(false);
      console.log("=== END SAVED RECIPES FETCH ===");
    }
  };

  // Fetch user profile data
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
      console.log('Profile data:', response.data);
      setProfile(response.data);
      
      // Initialize form data with profile values
      setFormData({
        bio: response.data.bio || '',
        pronouns: response.data.pronouns || '',
        personalLinks: '' // You might want to handle multiple links differently
      });
      
      // Set image preview if there's an image
      if (response.data.imageurl) {
        setImagePreview(response.data.imageurl);
      }
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.log('Profile not found, will create new one on save');
      } else {
        console.error('Error fetching user profile:', error);
      }
    } finally {
      setProfileLoading(false);
    }
  };

  // Handle profile form changes
  const handleProfileChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Handle profile form submission
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
      
      // If profile exists, update it, otherwise create it
      if (profile) {
        response = await axios.put(`http://localhost:5001/api/user/${userId}/profile`, {
          bio: formData.bio,
          pronouns: formData.pronouns,
          imageUrl: profile.imageurl // Keep the existing image URL
        });
      } else {
        response = await axios.post('http://localhost:5001/api/profile', {
          userId,
          username: user.username,
          bio: formData.bio,
          pronouns: formData.pronouns
        });
      }
      
      console.log('Profile saved:', response.data);
      setProfile(response.data);
      setFormSuccess(true);
      
      // Reset success message after a delay
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

  // Handle profile image upload
  const handleImageUpload = async (file) => {
    if (!user || !file) return;
    
    const userId = user.UserID || user.userid || user.userId || user.id;
    if (!userId) {
      console.error("Cannot find user ID in user object:", user);
      return;
    }
    
    // Convert file to base64
    const reader = new FileReader();
    
    reader.onloadend = async () => {
      try {
        const base64File = reader.result;
        
        const response = await axios.post(`http://localhost:5001/api/user/${userId}/profile/image`, {
          file: base64File
        });
        
        console.log('Image uploaded:', response.data);
        
        if (response.data.imageUrl) {
          // Update profile with new image URL
          setImagePreview(response.data.imageUrl);
          
          // If profile exists, update it with new image URL
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
      // Show preview immediately
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      
      // Upload image to server
      handleImageUpload(file);
    }
  };

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

  const isAdmin = user.isadmin;

  // Helper function to display star ratings
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
                {myRecipes.map((recipe) => {
                  console.log(`=== RENDERING RECIPE CARD ${recipe.recipeid} ===`);
                  console.log(`Recipe ${recipe.recipeid} in render:`, {
                    name: recipe.name,
                    imageurl: recipe.imageurl,
                    imageUrl: recipe.imageUrl,
                    keys: Object.keys(recipe)
                  });
                  
                  return (
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
                        // The backend controller uses 'imageUrl' (capital U)
                        // But we need to check for both versions to be safe
                        const imageUrl = recipe.imageUrl || recipe.imageurl;
                        
                        console.log(`Recipe ${recipe.recipeid} image rendering:`, {
                          imageUrl_version: recipe.imageUrl,
                          imageurl_version: recipe.imageurl,
                          final_imageUrl: imageUrl
                        });
                        
                        if (imageUrl) {
                          console.log(`Recipe ${recipe.recipeid} rendering image from URL:`, imageUrl);
                          return (
                            <img 
                              src={imageUrl}
                              alt={recipe.name}
                              style={{width: '100%', height: '100%', objectFit: 'cover'}}
                              onLoad={() => console.log(`Image for recipe ${recipe.recipeid} loaded successfully from ${imageUrl}!`)}
                              onError={(e) => {
                                console.error(`Image failed to load for recipe ${recipe.recipeid}:`, imageUrl);
                                e.target.onerror = null;
                                e.target.src = '/placeholder-recipe.jpg';
                              }}
                            />
                          );
                        } else {
                          console.log(`Recipe ${recipe.recipeid} has NO image URL`);
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
                  );
                })}
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
            {savedRecipesLoading ? (
              <div className="loading">Loading your saved recipes...</div>
            ) : savedRecipes.length > 0 ? (
              <div className="recipe-grid">
                {savedRecipes.map((recipe) => {
                  console.log(`Rendering saved recipe ${recipe.recipeid}:`, {
                    name: recipe.name,
                    imageurl: recipe.imageurl,
                    imageUrl: recipe.imageUrl,
                    image_url: recipe.image_url,
                    description: recipe.description?.substring(0, 30) + '...',
                    dateSaved: recipe.dateSaved,
                    fullRecipe: recipe
                  });
                  
                  return (
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
                        // The backend controller uses 'imageUrl' (capital U) but we need to check both
                        const imageUrl = recipe.imageUrl || recipe.imageurl;
                        
                        console.log(`Saved recipe ${recipe.recipeid} image rendering:`, {
                          imageUrl_version: recipe.imageUrl,
                          imageurl_version: recipe.imageurl,
                          final_imageUrl: imageUrl
                        });
                        
                        if (imageUrl) {
                          console.log(`Saved recipe ${recipe.recipeid} rendering image from URL:`, imageUrl);
                          return (
                            <img 
                              src={imageUrl}
                              alt={recipe.name}
                              style={{width: '100%', height: '100%', objectFit: 'cover'}}
                              onLoad={() => console.log(`Image for saved recipe ${recipe.recipeid} loaded successfully!`)}
                              onError={(e) => {
                                console.error(`Image failed to load for saved recipe ${recipe.recipeid}:`, imageUrl);
                                e.target.onerror = null;
                                e.target.src = '/placeholder-recipe.jpg';
                              }}
                            />
                          );
                        } else {
                          console.log(`Saved recipe ${recipe.recipeid} has NO image URL`);
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
                      <p className="recipe-description">{recipe.description?.substring(0, 100) || 'No description available'}</p>
                    </div>
                  </div>
                  );
                })}
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