const express = require('express');
const router = express.Router();
const recipeController = require('../controllers/recipeController');

// Get all unique ingredients
router.get('/ingredients', recipeController.getAllIngredients);

// Search recipes
router.get('/search', recipeController.searchRecipes);

// Get recipe by ID
router.get('/:id', recipeController.getRecipeById);

module.exports = router; 