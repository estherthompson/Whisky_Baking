const Recipe = require('../models/Recipe');

// Search recipes
const searchRecipes = async (req, res) => {
  try {
    const { query, ingredients } = req.query;
    const ingredientList = ingredients ? ingredients.split(',') : [];
    
    const searchQuery = {
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { ingredients: { $regex: query, $options: 'i' } }
      ]
    };

    if (ingredientList.length > 0) {
      searchQuery.ingredients = { $nin: ingredientList };
    }

    const recipes = await Recipe.find(searchQuery);
    res.json(recipes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get recipe by ID
const getRecipeById = async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }
    res.json(recipe);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all unique ingredients
const getAllIngredients = async (req, res) => {
  try {
    const recipes = await Recipe.find({}, 'ingredients');
    const allIngredients = [...new Set(recipes.flatMap(recipe => recipe.ingredients))];
    res.json(allIngredients);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  searchRecipes,
  getRecipeById,
  getAllIngredients
}; 