import express from 'express';
import { createRecipe, getRecipeById, getAllRecipes, savedRecipe, addRatingToRecipe, getSavedRecipes, getUserRatings, uploadRecipeImage, deleteSavedRecipe} from '../controllers/recipeController.js';
import { createRating } from '../controllers/ratingController.js';

const router = express.Router();

// Recipe routes
router.get('/recipes', getAllRecipes);
router.get('/recipes/:id', getRecipeById);
router.post('/recipes', createRecipe);
router.post('/recipes/save', savedRecipe);

router.post('/recipes/:recipeId/image', uploadRecipeImage);

router.get('/user/:userId/recipes', (req, res) => {
  console.log('User recipes route hit with userId:', req.params.userId);
  
  req.query = {
    ...req.query,
    userid: req.params.userId  
  };
  
  console.log('Updated query parameters:', JSON.stringify(req.query));
  console.log('Confirming userid is set correctly:', req.query.userid);
  
  return getAllRecipes(req, res);
});


router.get('/user/:userId/saved-recipes', getSavedRecipes);
router.delete('/user/:userId/saved-recipes/:recipeId', deleteSavedRecipe);
router.post('/user/:userId/saved-recipes/:recipeId', (req, res) => {
  const methodOverride = req.headers['x-http-method-override'];
  if (methodOverride && methodOverride.toLowerCase() === 'delete') {
    console.log('Using method override: POST -> DELETE');
    return deleteSavedRecipe(req, res);
  }
  return res.status(405).json({ error: 'Method not allowed. Expected DELETE method override.' });
});

router.get('/user/:userId/ratings', getUserRatings);


router.post('/recipes/:recipeid/ratings', addRatingToRecipe);
router.post('/recipes/rating', createRating);

export default router; 