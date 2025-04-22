import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/UploadRecipe.css';

const UploadRecipe = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    instructions: [''], // Initialize with one empty step
    recipeTime: '',
    ingredients: [{ 
      ingredientId: '', 
      wholeNumber: '', 
      fraction: '', 
      measurement: '', 
      name: '' 
    }],
    image: null // Add image to formData
  });
  const [ingredientsList, setIngredientsList] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerms, setSearchTerms] = useState(['']);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeIngredientIndex, setActiveIngredientIndex] = useState(null);
  const dropdownRef = useRef(null);

  const fractions = ['1/4', '1/3', '1/2', '2/3', '3/4'];

  const measurements = [
    // Volume measurements
    'cup', 'cups',
    'tbsp',
    'tsp',
    'ml',
    'L',
    'fl oz',
    
    // Weight measurements
    'g',
    'kg',
    'oz',
    'lb',
    
    // Package measurements
    'can',
    'bottle',
    'pack',
    'box',
    'jar',
    'stick',
    
    // Small measurements
    'pinch',
    'dash',
    'drop',
    
    // Count measurements
    'piece',
    'slice',
    'whole',
    'bunch',
    'clove',
    'sprig'
  ];

  useEffect(() => {
    // Check if user is logged in
    const user = localStorage.getItem('user');
    if (!user) {
      navigate('/login');
    }

    // Fetch available ingredients
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

    // Add click outside listener
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
      setFormData({
        ...formData,
        image: files[0] // Handle file input
      });
    } else if (name === 'wholeNumber') {
      // Allow only numbers and one decimal point
      const numericValue = value.replace(/[^0-9.]/g, '');
      // Ensure only one decimal point
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
    
    // Update search terms
    const newSearchTerms = [...searchTerms];
    newSearchTerms[index] = ingredient.name;
    setSearchTerms(newSearchTerms);
  };

  const handleIngredientSearch = (value, index) => {
    // Update search terms
    const newSearchTerms = [...searchTerms];
    newSearchTerms[index] = value;
    setSearchTerms(newSearchTerms);

    // Update ingredient name directly
    const newIngredients = [...formData.ingredients];
    newIngredients[index] = {
      ...newIngredients[index],
      name: value,
      ingredientId: '' // Clear ID when manually typing
    };
    setFormData({
      ...formData,
      ingredients: newIngredients
    });

    setActiveIngredientIndex(index);
    setShowDropdown(true);
  };

  const addIngredient = () => {
    // Check if the last ingredient has required fields filled
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
    // Check if the last instruction is not empty
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

    // Validate that each ingredient has at least a whole number or fraction
    const invalidIngredients = formData.ingredients.filter(
      ing => !ing.wholeNumber && !ing.fraction
    );

    if (invalidIngredients.length > 0) {
      setError('Please enter either a whole number or fraction (or both) for each ingredient.');
      return;
    }

    try {
      // Get user from localStorage
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user) {
        setError('You must be logged in to upload a recipe');
        navigate('/login');
        return;
      }
      
      // Get userId from different possible property names like in UserAccount.js
      const userid = user.UserID || user.userid || user.userId || user.id;
      if (!userid) {
        console.error("Cannot find user ID in user object:", user);
        setError('User ID not found. Please log in again.');
        return;
      }
      
      console.log("Using user ID for recipe creation:", userid);
      
      // Format instructions as a single string with numbered steps
      const formattedInstructions = formData.instructions
        .map((instruction, index) => `${index + 1}. ${instruction}`)
        .join('\n\n');
      
      // Convert recipeTime to a number
      const recipeTimeValue = parseInt(formData.recipeTime, 10);
      
      // Format ingredient data
      const formattedIngredients = formData.ingredients.map(ing => ({
        ingredientId: ing.ingredientId, 
        name: ing.name,
        quantity: `${ing.wholeNumber || ''}${ing.fraction ? ' ' + ing.fraction : ''}${ing.measurement ? ' ' + ing.measurement : ''}`.trim()
      }));
      
      // Format the recipe data
      const recipeData = {
        name: formData.name,
        description: formData.description,
        instructions: formattedInstructions,
        recipeTime: recipeTimeValue,
        userid: userid, // Use the correctly found userid
        ingredients: formattedIngredients
      };

      console.log('Submitting recipe:', recipeData);
      const response = await axios.post('http://localhost:5001/api/recipes', recipeData);

      setSuccess('Recipe uploaded successfully!');
      
      // Reset form after successful submission
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
    } catch (err) {
      console.error('Error uploading recipe:', err);
      setError(err.response?.data?.message || 'Failed to upload recipe. Please try again.');
    }
  };

  // Update the filtered ingredients to use the current search term
  const filteredIngredients = activeIngredientIndex !== null && searchTerms[activeIngredientIndex]
    ? ingredientsList.filter(ing => 
        ing.name.toLowerCase().includes(searchTerms[activeIngredientIndex].toLowerCase())
      )
    : [];

  return (
    <div className="upload-recipe-container">
      <h2>Upload New Recipe</h2>
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      
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
          <input
            type="file"
            id="image"
            name="image"
            accept="image/*"
            onChange={handleChange}
          />
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