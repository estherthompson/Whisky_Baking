import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/UploadRecipe.css';

const UploadRecipe = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    instructions: [''], 
    recipeTime: '',
    ingredients: [{ 
      ingredientId: '', 
      wholeNumber: '', 
      fraction: '', 
      measurement: '', 
      name: '' 
    }],
    image: null 
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [recipeId, setRecipeId] = useState(null);
  const [ingredientsList, setIngredientsList] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerms, setSearchTerms] = useState(['']);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeIngredientIndex, setActiveIngredientIndex] = useState(null);
  const dropdownRef = useRef(null);

  const fractions = ['1/4', '1/3', '1/2', '2/3', '3/4'];

  const measurements = [
    'cup', 'cups',
    'tbsp',
    'tsp',
    'ml',
    'L',
    'fl oz',
    
    'g',
    'kg',
    'oz',
    'lb',
    
    'can',
    'bottle',
    'pack',
    'box',
    'jar',
    'stick',
    
    'pinch',
    'dash',
    'drop',
    
    'piece',
    'slice',
    'whole',
    'bunch',
    'clove',
    'sprig'
  ];

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) {
      navigate('/login');
    }

    const fetchIngredients = async () => {
      try {
        const response = await axios.get('http://localhost:5001/api/ingredients');
        setIngredientsList(response.data);
      } catch (err) {
        console.error('Error fetching ingredients:', err);
        setError('Failed to load ingredients. Please try again later.');
      }
    };

    fetchIngredients();

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [navigate]);

  const handleChange = (e, index) => {
    const { name, value, type, files } = e.target;
    if (type === 'file') {
      const file = files[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result);
        };
        reader.readAsDataURL(file);
        
        setFormData({
          ...formData,
          image: file 
        });
      }
    } else if (name === 'wholeNumber') {
      const numericValue = value.replace(/[^0-9.]/g, '');
      const parts = numericValue.split('.');
      const sanitizedValue = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : numericValue;
      
      const newIngredients = [...formData.ingredients];
      newIngredients[index] = {
        ...newIngredients[index],
        [name]: sanitizedValue
      };
      setFormData({
        ...formData,
        ingredients: newIngredients
      });
    } else if (name === 'fraction' || name === 'measurement') {
      const newIngredients = [...formData.ingredients];
      newIngredients[index] = {
        ...newIngredients[index],
        [name]: value
      };
      setFormData({
        ...formData,
        ingredients: newIngredients
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleIngredientSelect = (ingredient, index) => {
    const newIngredients = [...formData.ingredients];
    newIngredients[index] = {
      ...newIngredients[index],
      ingredientId: ingredient.ingredientid,
      name: ingredient.name
    };
    setFormData({
      ...formData,
      ingredients: newIngredients
    });
    setShowDropdown(false);
    
  
    const newSearchTerms = [...searchTerms];
    newSearchTerms[index] = ingredient.name;
    setSearchTerms(newSearchTerms);
  };

  const handleIngredientSearch = (value, index) => {
    const newSearchTerms = [...searchTerms];
    newSearchTerms[index] = value;
    setSearchTerms(newSearchTerms);

    const newIngredients = [...formData.ingredients];
    newIngredients[index] = {
      ...newIngredients[index],
      name: value,
      ingredientId: '' 
    };
    setFormData({
      ...formData,
      ingredients: newIngredients
    });

    setActiveIngredientIndex(index);
    setShowDropdown(true);
  };

  const addIngredient = () => {
    const lastIngredient = formData.ingredients[formData.ingredients.length - 1];
    if (!lastIngredient.name || !lastIngredient.measurement || 
        (!lastIngredient.wholeNumber && !lastIngredient.fraction)) {
      setError('Please fill out ingredient name, measurement, and amount (whole number or fraction) before adding another ingredient.');
      return;
    }
    setFormData({
      ...formData,
      ingredients: [
        ...formData.ingredients,
        { name: '', wholeNumber: '', fraction: '', measurement: '' }
      ]
    });
    setSearchTerms([...searchTerms, '']);
    setError('');
  };

  const removeIngredient = (index) => {
    const newIngredients = formData.ingredients.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      ingredients: newIngredients
    });
  };

  const addInstruction = () => {
    if (formData.instructions[formData.instructions.length - 1].trim() === '') {
      setError('Please fill out the current instruction step before adding a new one.');
      return;
    }
    setFormData({
      ...formData,
      instructions: [...formData.instructions, '']
    });
    setError('');
  };

  const removeInstruction = () => {
    if (formData.instructions.length > 1) {
      const newInstructions = formData.instructions.slice(0, -1);
      setFormData({
        ...formData,
        instructions: newInstructions
      });
    }
  };

  const handleInstructionChange = (index, value) => {
    const newInstructions = [...formData.instructions];
    newInstructions[index] = value;
    setFormData({
      ...formData,
      instructions: newInstructions
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const invalidIngredients = formData.ingredients.filter(
      ing => !ing.wholeNumber && !ing.fraction
    );

    if (invalidIngredients.length > 0) {
      setError('Please enter either a whole number or fraction (or both) for each ingredient.');
      return;
    }

    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user) {
        setError('You must be logged in to upload a recipe');
        navigate('/login');
        return;
      }
      
      const userid = user.UserID || user.userid || user.userId || user.id;
      if (!userid) {
        console.error("Cannot find user ID in user object:", user);
        setError('User ID not found. Please log in again.');
        return;
      }
      
      console.log("Using user ID for recipe creation:", userid);
      
      const formattedInstructions = formData.instructions
        .map((instruction, index) => `${index + 1}. ${instruction}`)
        .join('\n\n');
      
      const recipeTimeValue = parseInt(formData.recipeTime, 10);
      
      const formattedIngredients = formData.ingredients.map(ing => ({
        ingredientId: ing.ingredientId, 
        name: ing.name,
        quantity: `${ing.wholeNumber || ''}${ing.fraction ? ' ' + ing.fraction : ''}${ing.measurement ? ' ' + ing.measurement : ''}`.trim()
      }));
      
      const recipeData = {
        name: formData.name,
        description: formData.description,
        instructions: formattedInstructions,
        recipeTime: recipeTimeValue,
        userid: userid, 
        ingredients: formattedIngredients
      };

      console.log('Submitting recipe data:', recipeData);
      console.log('Has image to upload:', !!formData.image);
      
      console.log('Step 1: Creating recipe...');
      const response = await axios.post('http://localhost:5001/api/recipes', recipeData);
      console.log('Recipe creation API response:', response.data);
      
      if (!response.data || !response.data.recipeid) {
        console.error('Recipe created but no recipe ID returned:', response.data);
        setError('Recipe was created but could not upload image: No recipe ID returned');
        return;
      }
      
      const createdRecipeId = response.data.recipeid;
      console.log('Extracted recipe ID from response:', createdRecipeId);
      setRecipeId(createdRecipeId);
      
      let imageUrl = null;
      let imageSuccess = false;
      if (formData.image && createdRecipeId) {
        console.log('Step 2: Uploading image for recipe ID:', createdRecipeId);
        setImageUploading(true);
        try {
          const fileReader = new FileReader();
          
          const readFilePromise = new Promise((resolve, reject) => {
            fileReader.onload = () => resolve(fileReader.result);
            fileReader.onerror = (error) => reject(error);
          });
          
          fileReader.readAsDataURL(formData.image);
          
          const base64Data = await readFilePromise;
          console.log('Image converted to base64, length:', base64Data.length);
          
          const imageResponse = await axios.post(
            `http://localhost:5001/api/recipes/${createdRecipeId}/image`, 
            { file: base64Data }
          );
          
          console.log('Image upload response:', imageResponse.data);
          
          if (imageResponse.data) {
            if (imageResponse.data.imageUrl) {
              imageUrl = imageResponse.data.imageUrl;
              imageSuccess = true;
              console.log('Image uploaded successfully, URL from imageUrl:', imageUrl);
            } else if (imageResponse.data.imageurl) {
              imageUrl = imageResponse.data.imageurl;
              imageSuccess = true;
              console.log('Image uploaded successfully, URL from imageurl:', imageUrl);
            } else {
              console.warn('Image upload succeeded but no URL returned:', imageResponse.data);
            }
          } else {
            console.warn('Image upload succeeded but empty response received');
          }
        } catch (imageError) {
          console.error('Image upload failed:', imageError);
          console.error('Error response:', imageError.response?.data);
          setError(`Recipe created but image upload failed: ${imageError.response?.data?.error || imageError.message}`);
        } finally {
          setImageUploading(false);
        }
      } else {
        console.log('No image to upload or missing recipe ID', {
          hasImage: !!formData.image,
          recipeId: createdRecipeId
        });
      }

      if (imageSuccess) {
        setSuccess('Recipe and image uploaded successfully! Your recipe has been submitted for approval and should be visible within 24 hours.');
      } else if (imageUrl) {
        setSuccess('Recipe uploaded successfully with image! Your recipe has been submitted for approval and should be visible within 24 hours.');
      } else if (formData.image) {
        setSuccess('Recipe uploaded successfully but there was a problem with the image. Your recipe has been submitted for approval and should be visible within 24 hours.');
      } else {
        setSuccess('Recipe uploaded successfully! Your recipe has been submitted for approval and should be visible within 24 hours.');
      }
      
      setFormData({
        name: '',
        description: '',
        instructions: [''],
        recipeTime: '',
        ingredients: [{ 
          ingredientId: '', 
          wholeNumber: '', 
          fraction: '', 
          measurement: '', 
          name: '' 
        }],
        image: null
      });
      setImagePreview(null);
    } catch (err) {
      console.error('Error uploading recipe:', err);
      console.error('Error response:', err.response?.data);
      setError(err.response?.data?.error || 'Failed to upload recipe. Please try again.');
    }
  };

  const filteredIngredients = activeIngredientIndex !== null && searchTerms[activeIngredientIndex]
    ? ingredientsList.filter(ing => 
        ing.name.toLowerCase().includes(searchTerms[activeIngredientIndex].toLowerCase())
      )
    : [];

  return (
    <div className="upload-recipe-container">
      <h2>Upload New Recipe</h2>
      
      <div className="approval-notice">
        <p>
          <strong>Please Note:</strong> All recipes require admin approval before they appear on the site. 
          Approval typically takes up to 24 hours. Thank you for your patience!
        </p>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      {imageUploading && <div className="loading-message">Uploading image...</div>}
      
      <form onSubmit={handleSubmit} className="recipe-form">
        <div className="form-group">
          <label htmlFor="name">Recipe Name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="image">Recipe Image</label>
          <div className="image-upload-container">
            {imagePreview && (
              <div className="image-preview">
                <img 
                  src={imagePreview} 
                  alt="Recipe preview" 
                  className="recipe-image-preview" 
                />
              </div>
            )}
            <input
              type="file"
              id="image"
              name="image"
              accept="image/*"
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="instructions-section">
          <h3>Instructions</h3>
          {formData.instructions.map((instruction, index) => (
            <div key={index} className="instruction-row">
              <div className="form-group instruction-input">
                <label>Step {index + 1}</label>
                <textarea
                  value={instruction}
                  onChange={(e) => handleInstructionChange(index, e.target.value)}
                  placeholder={`Enter step ${index + 1}`}
                  className={!instruction.trim() ? 'input-warning' : ''}
                  required
                />
                {!instruction.trim() && (
                  <div className="validation-container">
                    <div className="validation-message">Enter instruction step</div>
                  </div>
                )}
              </div>
            </div>
          ))}

          <div className="buttons-row">
            <button
              type="button"
              className="add-instruction"
              onClick={addInstruction}
            >
              Add Another Step
            </button>
            {formData.instructions.length > 1 && (
              <button
                type="button"
                className="remove-instruction"
                onClick={removeInstruction}
              >
                Remove Last Step
              </button>
            )}
          </div>
        </div>

        <div className="cooking-details">
          <div className="form-group time-input">
            <label htmlFor="recipeTime">Cooking Time (minutes)</label>
            <input
              type="number"
              id="recipeTime"
              name="recipeTime"
              value={formData.recipeTime}
              onChange={handleChange}
              placeholder="e.g., 30"
              min="1"
              required
            />
          </div>
        </div>

        <div className="ingredients-section">
          <h3>Ingredients</h3>
          {formData.ingredients.map((ingredient, index) => (
            <div key={index} className="ingredient-row">
              <div className="form-group ingredient-search" ref={dropdownRef}>
                <label>Ingredient</label>
                <input
                  type="text"
                  value={searchTerms[index] || ''}
                  onChange={(e) => handleIngredientSearch(e.target.value, index)}
                  onClick={() => {
                    setActiveIngredientIndex(index);
                    setShowDropdown(true);
                  }}
                  placeholder="Search ingredients..."
                  className={!ingredient.name ? 'input-warning' : ''}
                />
                {!ingredient.name && (
                  <div className="validation-container">
                    <div className="validation-message">Enter an ingredient name</div>
                  </div>
                )}
                {showDropdown && activeIngredientIndex === index && searchTerms[index] && (
                  <div className="ingredients-dropdown">
                    {filteredIngredients.map((ing) => (
                      <div
                        key={ing.ingredientid}
                        className="ingredient-option"
                        onClick={() => handleIngredientSelect(ing, index)}
                      >
                        {ing.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="amount-inputs">
                <div className="form-group whole-number-input">
                  <label>Amount</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    pattern="[0-9]*[.]?[0-9]*"
                    name="wholeNumber"
                    value={ingredient.wholeNumber}
                    onChange={(e) => handleChange(e, index)}
                    placeholder="1"
                    className={!ingredient.wholeNumber && !ingredient.fraction ? 'input-warning' : ''}
                  />
                </div>

                <div className="form-group fraction-input">
                  <label>Fraction (optional)</label>
                  <select
                    name="fraction"
                    value={ingredient.fraction}
                    onChange={(e) => handleChange(e, index)}
                    className={!ingredient.wholeNumber && !ingredient.fraction ? 'input-warning' : ''}
                  >
                    <option value="">None</option>
                    {fractions.map((fraction) => (
                      <option key={fraction} value={fraction}>
                        {fraction}
                      </option>
                    ))}
                  </select>
                </div>
                {(!ingredient.wholeNumber && !ingredient.fraction) && (
                  <div className="validation-message">Enter a whole number or fraction</div>
                )}
              </div>

              <div className="form-group measurement-input">
                <label>Measurement</label>
                <select
                  name="measurement"
                  value={ingredient.measurement}
                  onChange={(e) => handleChange(e, index)}
                  className={!ingredient.measurement ? 'input-warning' : ''}
                >
                  <option value="">Select measurement</option>
                  {measurements.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>
                {!ingredient.measurement && (
                  <div className="validation-container">
                    <div className="validation-message">Select a measurement</div>
                  </div>
                )}
              </div>

              <div className="ingredient-preview">
                <span className="preview-label">Preview:</span>
                <span className="preview-text">
                  {ingredient.name && `${ingredient.name}: `}
                  {ingredient.wholeNumber}
                  {ingredient.fraction && ` ${ingredient.fraction}`}
                  {ingredient.measurement && ` ${ingredient.measurement}`}
                </span>
              </div>
            </div>
          ))}

          <div className="buttons-row">
            <button
              type="button"
              className="add-ingredient"
              onClick={addIngredient}
            >
              Add Another Ingredient
            </button>
            {formData.ingredients.length > 1 && (
              <button
                type="button"
                className="remove-ingredient"
                onClick={() => removeIngredient(formData.ingredients.length - 1)}
              >
                Remove Last Ingredient
              </button>
            )}
          </div>
        </div>

        <button type="submit" className="submit-btn">
          Upload Recipe
        </button>
      </form>
    </div>
  );
};

export default UploadRecipe; 