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
  faHistory,
  faTimes,
  faEye,
  faEyeSlash
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
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [submittingPassword, setSubmittingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);
  
  useEffect(() => {
    return () => {
    };
  }, []);

  useEffect(() => {
    if (!user) {
      return;
    }
    
    // Fetch appropriate data based on active tab
    if (activeTab === 'my-recipes') {
      fetchUserRecipes();
    } else if (activeTab === 'activity') {
      fetchUserActivities();
    } else if (activeTab === 'saved') {
      setSavedRecipesLoading(true);
      fetchSavedRecipes();
    } else if (activeTab === 'settings') {
      fetchUserProfile();
    }
  }, [activeTab, user]);

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
    
    console.log('User ID for ratings query:', userId);
    setActivityLoading(true);
    
    try {
      // First try the debug endpoint to check what's in the database
      const debugUrl = `http://localhost:5001/api/debug/user/${userId}/ratings`;
      console.log('Fetching debug ratings info from:', debugUrl);
      
      try {
        const debugResponse = await axios.get(debugUrl);
        console.log('Debug ratings response:', debugResponse.data);
      } catch (debugError) {
        console.error('Debug endpoint error (non-fatal):', debugError);
      }
      
      // Now fetch the actual user ratings
      const url = `http://localhost:5001/api/user/${userId}/ratings`;
      console.log('Fetching user ratings from:', url);
      
      const response = await axios.get(url);
      
      console.log('User ratings response data:', response.data);
      
      if (!Array.isArray(response.data)) {
        console.error('Expected array response but got:', typeof response.data);
        setActivities([]);
        setActivityLoading(false);
        return;
      }
      
      if (response.data.length === 0) {
        console.log('No ratings found for this user');
        setActivities([]);
        setActivityLoading(false);
        return;
      }
      
      const ratingsActivities = response.data.map(rating => {
        console.log('Processing rating:', rating);
        return {
          id: rating.id,
          type: 'rating',
          recipe: {
            id: rating.recipe_id,
            name: rating.recipe_name
          },
          date: rating.created_at,
          data: {
            score: rating.rating,
            review: rating.review || ''
          }
        };
      });
      
      console.log('Processed activities:', ratingsActivities);
      
      setActivities(ratingsActivities);
      setActivityLoading(false);
      
    } catch (error) {
      console.error('Error fetching user ratings:', error);
      console.error('Error details:', error.response?.data || error.message);
      console.error('Error status:', error.response?.status);
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
    
    const originalRecipes = [...savedRecipes];
    setSavedRecipes(savedRecipes.filter(recipe => recipe.recipeid !== recipeId));
    
    try {
      const response = await axios({
        method: 'POST',
        url: `http://localhost:5001/api/user/${userId}/saved-recipes/${recipeId}`,
        headers: {
          'Content-Type': 'application/json',
          'X-HTTP-Method-Override': 'DELETE'
        }
      });
      
      console.log('Delete response:', response.data);
      
    } catch (error) {
      console.error('Error removing saved recipe:', error);
      console.error('Error details:', error.response?.data || error.message);
      
      setSavedRecipes(originalRecipes);
      
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

  const handleDeleteAccount = async () => {
    if (!user) return;
    
    const userId = user.UserID || user.userid || user.userId || user.id;
    if (!userId) {
      console.error("Cannot find user ID in user object", user);
      alert('User ID not found. Please try logging out and back in.');
      return;
    }
    
    // Show confirmation dialog
    const confirmDelete = window.confirm(
      'Are you sure you want to delete your account? This action cannot be undone and will delete all your recipes, saved recipes, and profile information.'
    );
    
    if (!confirmDelete) return;
    
    try {
      // Delete user account
      const response = await axios.delete(`http://localhost:5001/api/auth/user/${userId}`);
      
      // On successful deletion
      alert('Your account has been successfully deleted.');
      
      // Clear user data from local storage
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      
      // Redirect to home page
      navigate('/');
    } catch (error) {
      console.error('Error deleting account:', error);
      alert(`Failed to delete account: ${error.response?.data?.error || 'Unknown error occurred'}. Please try again.`);
    }
  };

  const isAdmin = user.isadmin;

  const renderStarRating = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    // Add full stars
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <FontAwesomeIcon 
          key={`star-${i}`} 
          icon={faStar} 
          style={{ color: '#FFC107' }} 
        />
      );
    }
    
    // Add half star if needed
    if (hasHalfStar) {
      stars.push(
        <FontAwesomeIcon 
          key="half-star" 
          icon={faStar} 
          style={{ color: '#FFC107', opacity: 0.5 }} 
        />
      );
    }
    
    // Add empty stars to make 5 stars total
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <FontAwesomeIcon 
          key={`empty-star-${i}`} 
          icon={faStar} 
          style={{ color: '#ccc' }} 
        />
      );
    }
    
    return (
      <div className="star-rating-display">
        {stars} <span className="rating-number">({rating}/5)</span>
      </div>
    );
  };

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value
    });
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) return;
    
    const userId = user.UserID || user.userid || user.userId || user.id;
    if (!userId) {
      setPasswordError('User ID not found');
      return;
    }
    
    console.log('Starting password change process for user ID:', userId);
    console.log('Password data:', {
      currentPasswordLength: passwordData.currentPassword.length,
      newPasswordLength: passwordData.newPassword.length,
      confirmPasswordLength: passwordData.confirmPassword.length
    });
    
    // Validate inputs
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setPasswordError('All fields are required');
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long');
      return;
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }
    
    setSubmittingPassword(true);
    setPasswordError('');
    
    try {
      console.log('Sending password change request to:', `http://localhost:5001/api/auth/user/${userId}/password`);
      
      const payload = {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      };
      
      console.log('Request payload:', payload);
      
      const response = await axios.put(`http://localhost:5001/api/auth/user/${userId}/password`, payload);
      
      console.log('Password change response:', response.data);
      
      setPasswordSuccess('Password changed successfully');
      
      // Reset form
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      // Close the modal after a delay
      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordSuccess('');
      }, 2000);
    } catch (error) {
      console.error('Error changing password:', error);
      console.error('Error response data:', error.response?.data);
      console.error('Error status:', error.response?.status);
      setPasswordError(error.response?.data?.error || 'Error changing password');
    } finally {
      setSubmittingPassword(false);
    }
  };

  const openPasswordModal = () => {
    setShowPasswordModal(true);
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setPasswordError('');
    setPasswordSuccess('');
  };

  // Test functions for debugging
  const runPasswordTest = async () => {
    if (!user) return;
    
    const userId = user.UserID || user.userid || user.userId || user.id;
    if (!userId) {
      console.error("Cannot find user ID in user object", user);
      alert('User ID not found. Please try logging out and back in.');
      return;
    }
    
    try {
      // First, test the database debug endpoint
      console.log('Testing database connection...');
      const debugResponse = await axios.get('http://localhost:5001/api/auth/debug/user-account');
      console.log('Debug response:', debugResponse.data);
      
      // Then test direct password update
      console.log('Testing direct password update...');
      const testPassword = 'test123';
      const testResponse = await axios.post('http://localhost:5001/api/auth/test/password-update', {
        userId: userId,
        newPassword: testPassword
      });
      
      console.log('Test password update response:', testResponse.data);
      alert(`Test completed! Check console for details. Password temporarily set to: ${testPassword}`);
    } catch (error) {
      console.error('Error during test:', error);
      console.error('Error response:', error.response?.data);
      alert(`Test failed: ${error.response?.data?.error || error.message}`);
    }
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
              {process.env.NODE_ENV !== 'production'}
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
                            onClick={() => handleRecipeClick({ recipeid: activity.recipe?.id })}
                          >
                            {activity.recipe?.name || 'Unknown Recipe'}
                          </span>
                        </h3>
                        <span className="activity-date">{formatDate(activity.date)}</span>
                      </div>
                      <div className="activity-detail">
                        <div className="rating-score">
                          <span>Your rating: </span>
                          <span className="rating-stars">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <FontAwesomeIcon 
                                key={star}
                                icon={faStar} 
                                style={{ 
                                  color: star <= activity.data.score ? '#FFC107' : '#e0e0e0',
                                  marginRight: '2px'
                                }} 
                              />
                            ))}
                          </span>
                          <span className="rating-number">({activity.data.score}/5)</span>
                        </div>
                        {activity.data.review && (
                          <p className="review-text">"{activity.data.review}"</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-activity">
                <p>No ratings found. Rate some recipes to see your activity here!</p>
                <button 
                  className="explore-btn"
                  onClick={() => navigate('/')}
                >
                  Explore Recipes to Rate
                </button>
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
                  <button 
                    className="action-btn change-password-btn"
                    onClick={openPasswordModal}
                  >
                    Change Password
                  </button>
                  <button 
                    className="action-btn delete-account-btn"
                    onClick={handleDeleteAccount}
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
            <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
          </div>
        )}
      </div>

      {/* Password change modal */}
      {showPasswordModal && (
        <div className="modal-backdrop">
          <div className="modal-content password-modal">
            <h2>Change Password</h2>
            <form onSubmit={handlePasswordSubmit}>
              <div className="password-field">
                <label htmlFor="currentPassword">Current Password</label>
                <div className="password-input-container">
                  <input 
                    type={showCurrentPassword ? "text" : "password"} 
                    id="currentPassword" 
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    placeholder="Enter your current password"
                  />
                  <button 
                    type="button" 
                    className="toggle-password"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    <FontAwesomeIcon icon={showCurrentPassword ? faEyeSlash : faEye} />
                  </button>
                </div>
              </div>
              
              <div className="password-field">
                <label htmlFor="newPassword">New Password</label>
                <div className="password-input-container">
                  <input 
                    type={showNewPassword ? "text" : "password"} 
                    id="newPassword" 
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    placeholder="Enter your new password"
                  />
                  <button 
                    type="button" 
                    className="toggle-password"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    <FontAwesomeIcon icon={showNewPassword ? faEyeSlash : faEye} />
                  </button>
                </div>
              </div>
              
              <div className="password-field">
                <label htmlFor="confirmPassword">Confirm New Password</label>
                <div className="password-input-container">
                  <input 
                    type={showConfirmPassword ? "text" : "password"} 
                    id="confirmPassword" 
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    placeholder="Confirm your new password"
                  />
                  <button 
                    type="button" 
                    className="toggle-password"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <FontAwesomeIcon icon={showConfirmPassword ? faEyeSlash : faEye} />
                  </button>
                </div>
              </div>
              
              {passwordError && <div className="error-message">{passwordError}</div>}
              {passwordSuccess && <div className="success-message">{passwordSuccess}</div>}
              
              <div className="modal-actions">
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={() => setShowPasswordModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="save-btn"
                  disabled={submittingPassword}
                >
                  {submittingPassword ? 'Changing...' : 'Change Password'}
                </button>
              </div>
              
              {process.env.NODE_ENV !== 'production' && (
                <div style={{ marginTop: '20px', borderTop: '1px dashed #ccc', paddingTop: '15px' }}>
                  <p style={{ fontSize: '14px', color: '#888', marginBottom: '10px' }}>Debug Tools:</p>
                  <button 
                    type="button"
                    onClick={runPasswordTest}
                    style={{
                      backgroundColor: '#ff9800',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '8px 15px',
                      fontSize: '14px',
                      cursor: 'pointer'
                    }}
                  >
                    Test Password Update
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

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