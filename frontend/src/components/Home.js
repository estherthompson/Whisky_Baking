import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/Home.css';

const Home = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [allIngredients, setAllIngredients] = useState([
    'flour',
    'sugar',
    'eggs',
    'butter',
    'vanilla extract',
    'baking powder',
    'milk',
    'salt',
    'chocolate chips',
    'cocoa powder'
  ]);
  const [selectedIngredients, setSelectedIngredients] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [featuredRecipes, setFeaturedRecipes] = useState([
    {
      id: 1,
      title: 'Sweet Treats',
      category: 'Desserts',
      color: '#FFD1DC', // Pastel Pink
      image: '/images/desserts.jpg'
    },
    {
      id: 2,
      title: 'Bread & Pastries',
      category: 'Bakery',
      color: '#B5EAD7', // Pastel Mint
      image: '/images/bread.jpg'
    },
    {
      id: 3,
      title: 'Healthy Bakes',
      category: 'Healthy',
      color: '#C7CEEA', // Pastel Blue
      image: '/images/healthy.jpg'
    },
    {
      id: 4,
      title: 'Holiday Specials',
      category: 'Seasonal',
      color: '#FFB7B2', // Pastel Coral
      image: '/images/holiday.jpg'
    }
  ]);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [popularRecipes, setPopularRecipes] = useState([]);
  const [newReview, setNewReview] = useState({ user: '', rating: 0, comment: '' });
  const [showReviewForm, setShowReviewForm] = useState(false);

  const mockRecipes = [
    {
      id: 1,
      title: "Classic Vanilla Cake",
      ingredients: [
        "2 cups all-purpose flour",
        "1 1/2 cups sugar",
        "1/2 cup butter, softened",
        "3 eggs",
        "1 cup milk",
        "2 tsp vanilla extract",
        "1 tbsp baking powder",
        "1/2 tsp salt"
      ],
      instructions: [
        "Preheat oven to 350°F (175°C).",
        "Cream butter and sugar until light and fluffy.",
        "Add eggs one at a time, beating well after each addition.",
        "Mix in vanilla extract.",
        "Combine flour, baking powder, and salt in a separate bowl.",
        "Alternately add dry ingredients and milk to the butter mixture.",
        "Pour batter into greased cake pans.",
        "Bake for 25-30 minutes or until a toothpick comes out clean."
      ],
      image: "https://example.com/vanilla-cake.jpg",
      color: "#FFD1DC",
      rating: 4.5,
      reviews: [
        { user: "Sarah", rating: 5, comment: "Best vanilla cake ever!" },
        { user: "Mike", rating: 4, comment: "Great recipe, very moist" },
        { user: "Emma", rating: 4.5, comment: "Perfect for birthdays" }
      ]
    },
    {
      id: 2,
      title: "Eggless Vanilla Cake",
      ingredients: [
        "2 cups all-purpose flour",
        "1 1/2 cups sugar",
        "1/2 cup vegetable oil",
        "1 cup yogurt",
        "1 cup milk",
        "2 tsp vanilla extract",
        "1 tbsp baking powder",
        "1/2 tsp salt"
      ],
      instructions: [
        "Preheat oven to 350°F (175°C).",
        "Mix yogurt and sugar until well combined.",
        "Add oil and vanilla extract, mix well.",
        "Combine flour, baking powder, and salt in a separate bowl.",
        "Alternately add dry ingredients and milk to the yogurt mixture.",
        "Pour batter into greased cake pans.",
        "Bake for 25-30 minutes or until a toothpick comes out clean."
      ],
      image: "https://example.com/eggless-cake.jpg",
      color: "#B5EAD7",
      rating: 4.2,
      reviews: [
        { user: "John", rating: 4, comment: "Great eggless option!" },
        { user: "Lisa", rating: 4.5, comment: "Perfect for my egg allergy" }
      ]
    },
    {
      id: 3,
      title: "Dairy-Free Vanilla Cake",
      ingredients: [
        "2 cups all-purpose flour",
        "1 1/2 cups sugar",
        "1/2 cup coconut oil",
        "3 eggs",
        "1 cup almond milk",
        "2 tsp vanilla extract",
        "1 tbsp baking powder",
        "1/2 tsp salt"
      ],
      instructions: [
        "Preheat oven to 350°F (175°C).",
        "Cream coconut oil and sugar until light and fluffy.",
        "Add eggs one at a time, beating well after each addition.",
        "Mix in vanilla extract.",
        "Combine flour, baking powder, and salt in a separate bowl.",
        "Alternately add dry ingredients and almond milk to the oil mixture.",
        "Pour batter into greased cake pans.",
        "Bake for 25-30 minutes or until a toothpick comes out clean."
      ],
      image: "https://example.com/dairy-free-cake.jpg",
      color: "#C7CEEA",
      rating: 4.3,
      reviews: [
        { user: "Alex", rating: 4, comment: "Great dairy-free option" },
        { user: "Mia", rating: 4.5, comment: "Perfect for lactose intolerance" }
      ]
    },
    {
      id: 4,
      title: "Gluten-Free Vanilla Cake",
      ingredients: [
        "2 cups gluten-free flour blend",
        "1 1/2 cups sugar",
        "1/2 cup butter, softened",
        "3 eggs",
        "1 cup milk",
        "2 tsp vanilla extract",
        "1 tbsp baking powder",
        "1/2 tsp xanthan gum",
        "1/2 tsp salt"
      ],
      instructions: [
        "Preheat oven to 350°F (175°C).",
        "Cream butter and sugar until light and fluffy.",
        "Add eggs one at a time, beating well after each addition.",
        "Mix in vanilla extract.",
        "Combine gluten-free flour, baking powder, xanthan gum, and salt in a separate bowl.",
        "Alternately add dry ingredients and milk to the butter mixture.",
        "Pour batter into greased cake pans.",
        "Bake for 25-30 minutes or until a toothpick comes out clean."
      ],
      image: "https://example.com/gluten-free-cake.jpg",
      color: "#E2F0CB",
      rating: 4.4,
      reviews: [
        { user: "Chris", rating: 4, comment: "Great gluten-free option" },
        { user: "Sophie", rating: 4.5, comment: "Perfect for celiac disease" }
      ]
    },
    {
      id: 5,
      title: "Vegan Vanilla Cake",
      ingredients: [
        "2 cups all-purpose flour",
        "1 1/2 cups sugar",
        "1/2 cup vegetable oil",
        "1 cup almond milk",
        "2 tsp vanilla extract",
        "1 tbsp baking powder",
        "1/2 tsp salt",
        "1 tbsp apple cider vinegar"
      ],
      instructions: [
        "Preheat oven to 350°F (175°C).",
        "Mix almond milk and apple cider vinegar, set aside.",
        "Combine flour, sugar, baking powder, and salt in a bowl.",
        "Add oil and vanilla extract to the dry ingredients.",
        "Pour in the almond milk mixture and mix until smooth.",
        "Pour batter into greased cake pans.",
        "Bake for 25-30 minutes or until a toothpick comes out clean."
      ],
      image: "https://example.com/vegan-cake.jpg",
      color: "#FFB7B2",
      rating: 4.6,
      reviews: [
        { user: "Taylor", rating: 5, comment: "Perfect vegan cake!" },
        { user: "Jordan", rating: 4, comment: "Great texture and flavor" }
      ]
    },
    {
      id: 6,
      title: "Low-Sugar Vanilla Cake",
      ingredients: [
        "2 cups all-purpose flour",
        "3/4 cup sugar substitute",
        "1/2 cup butter, softened",
        "3 eggs",
        "1 cup milk",
        "2 tsp vanilla extract",
        "1 tbsp baking powder",
        "1/2 tsp salt"
      ],
      instructions: [
        "Preheat oven to 350°F (175°C).",
        "Cream butter and sugar substitute until light and fluffy.",
        "Add eggs one at a time, beating well after each addition.",
        "Mix in vanilla extract.",
        "Combine flour, baking powder, and salt in a separate bowl.",
        "Alternately add dry ingredients and milk to the butter mixture.",
        "Pour batter into greased cake pans.",
        "Bake for 25-30 minutes or until a toothpick comes out clean."
      ],
      image: "https://example.com/low-sugar-cake.jpg",
      color: "#FFDAC1",
      rating: 4.1,
      reviews: [
        { user: "David", rating: 4, comment: "Great for diabetics" },
        { user: "Rachel", rating: 4, comment: "Perfect sweetness level" }
      ]
    },
    {
      id: 7,
      title: "Chocolate Chip Cookies",
      ingredients: [
        "2 1/4 cups all-purpose flour",
        "1 cup butter, softened",
        "3/4 cup sugar",
        "3/4 cup brown sugar",
        "2 eggs",
        "1 tsp vanilla extract",
        "1 tsp baking soda",
        "1/2 tsp salt",
        "2 cups chocolate chips"
      ],
      instructions: [
        "Preheat oven to 375°F (190°C).",
        "Cream butter and sugars until light and fluffy.",
        "Add eggs and vanilla, mix well.",
        "Combine flour, baking soda, and salt in a separate bowl.",
        "Gradually add dry ingredients to the butter mixture.",
        "Stir in chocolate chips.",
        "Drop rounded tablespoons of dough onto baking sheets.",
        "Bake for 9-11 minutes or until golden brown."
      ],
      image: "https://example.com/chocolate-chip-cookies.jpg",
      color: "#D4A5A5",
      rating: 4.8,
      reviews: [
        { user: "Emily", rating: 5, comment: "Best cookies ever!" },
        { user: "Tom", rating: 4.5, comment: "Perfectly chewy" }
      ]
    },
    {
      id: 8,
      title: "Banana Bread",
      ingredients: [
        "2 cups all-purpose flour",
        "1 cup sugar",
        "1/2 cup butter, softened",
        "2 eggs",
        "3 ripe bananas",
        "1 tsp vanilla extract",
        "1 tsp baking soda",
        "1/2 tsp salt",
        "1/2 cup chopped walnuts (optional)"
      ],
      instructions: [
        "Preheat oven to 350°F (175°C).",
        "Mash bananas in a bowl.",
        "Cream butter and sugar until light and fluffy.",
        "Add eggs and vanilla, mix well.",
        "Stir in mashed bananas.",
        "Combine flour, baking soda, and salt in a separate bowl.",
        "Add dry ingredients to the banana mixture.",
        "Fold in walnuts if using.",
        "Pour batter into a greased loaf pan.",
        "Bake for 60-65 minutes or until a toothpick comes out clean."
      ],
      image: "https://example.com/banana-bread.jpg",
      color: "#F5E6CC",
      rating: 4.7,
      reviews: [
        { user: "Anna", rating: 5, comment: "Perfect way to use ripe bananas" },
        { user: "Ben", rating: 4.5, comment: "Great texture and flavor" }
      ]
    },
    {
      id: 9,
      title: "Blueberry Muffins",
      ingredients: [
        "2 cups all-purpose flour",
        "1 cup sugar",
        "1/2 cup butter, softened",
        "2 eggs",
        "1/2 cup milk",
        "1 tsp vanilla extract",
        "2 tsp baking powder",
        "1/2 tsp salt",
        "1 1/2 cups fresh blueberries"
      ],
      instructions: [
        "Preheat oven to 375°F (190°C).",
        "Cream butter and sugar until light and fluffy.",
        "Add eggs and vanilla, mix well.",
        "Combine flour, baking powder, and salt in a separate bowl.",
        "Alternately add dry ingredients and milk to the butter mixture.",
        "Gently fold in blueberries.",
        "Fill muffin cups 2/3 full with batter.",
        "Bake for 20-25 minutes or until golden brown."
      ],
      image: "https://example.com/blueberry-muffins.jpg",
      color: "#B8D8EB",
      rating: 4.6,
      reviews: [
        { user: "Olivia", rating: 5, comment: "Perfect breakfast treat" },
        { user: "Lucas", rating: 4.5, comment: "Great with coffee" }
      ]
    },
    {
      id: 10,
      title: "Carrot Cake",
      ingredients: [
        "2 cups all-purpose flour",
        "1 1/2 cups sugar",
        "1 cup vegetable oil",
        "4 eggs",
        "2 cups grated carrots",
        "1 tsp vanilla extract",
        "2 tsp baking powder",
        "1 tsp cinnamon",
        "1/2 tsp salt",
        "1/2 cup chopped walnuts",
        "1/2 cup raisins"
      ],
      instructions: [
        "Preheat oven to 350°F (175°C).",
        "Mix oil and sugar until well combined.",
        "Add eggs one at a time, beating well after each addition.",
        "Mix in vanilla extract.",
        "Combine flour, baking powder, cinnamon, and salt in a separate bowl.",
        "Add dry ingredients to the oil mixture.",
        "Fold in grated carrots, walnuts, and raisins.",
        "Pour batter into greased cake pans.",
        "Bake for 30-35 minutes or until a toothpick comes out clean."
      ],
      image: "https://example.com/carrot-cake.jpg",
      color: "#E6B8B7",
      rating: 4.9,
      reviews: [
        { user: "Grace", rating: 5, comment: "Best carrot cake recipe!" },
        { user: "Henry", rating: 4.5, comment: "Perfectly moist and flavorful" }
      ]
    },
    {
      id: 11,
      title: "Lemon Bars",
      ingredients: [
        "1 cup all-purpose flour",
        "1/2 cup butter, softened",
        "1/4 cup powdered sugar",
        "2 eggs",
        "1 cup sugar",
        "2 tbsp all-purpose flour",
        "1/2 tsp baking powder",
        "1/4 tsp salt",
        "2 tbsp lemon juice",
        "1 tbsp lemon zest"
      ],
      instructions: [
        "Preheat oven to 350°F (175°C).",
        "Mix 1 cup flour, butter, and powdered sugar for the crust.",
        "Press into an 8x8 inch baking pan.",
        "Bake for 15 minutes.",
        "Beat eggs and sugar until light and fluffy.",
        "Add 2 tbsp flour, baking powder, salt, lemon juice, and zest.",
        "Pour over baked crust.",
        "Bake for 20-25 minutes or until set.",
        "Cool and dust with powdered sugar."
      ],
      image: "https://example.com/lemon-bars.jpg",
      color: "#F5F5DC",
      rating: 4.7,
      reviews: [
        { user: "Isabella", rating: 5, comment: "Perfect balance of sweet and tart" },
        { user: "William", rating: 4.5, comment: "Great summer dessert" }
      ]
    },
    {
      id: 12,
      title: "Pumpkin Pie",
      ingredients: [
        "1 3/4 cups pumpkin puree",
        "3/4 cup sugar",
        "1/2 tsp salt",
        "1 tsp cinnamon",
        "1/2 tsp ginger",
        "1/4 tsp cloves",
        "2 eggs",
        "1 can (12 oz) evaporated milk",
        "1 unbaked pie crust"
      ],
      instructions: [
        "Preheat oven to 425°F (220°C).",
        "Mix pumpkin, sugar, salt, and spices in a bowl.",
        "Beat in eggs.",
        "Gradually stir in evaporated milk.",
        "Pour into pie crust.",
        "Bake for 15 minutes.",
        "Reduce temperature to 350°F (175°C).",
        "Bake for 40-50 minutes or until a knife inserted comes out clean."
      ],
      image: "https://example.com/pumpkin-pie.jpg",
      color: "#E6C9A8",
      rating: 4.8,
      reviews: [
        { user: "Sophia", rating: 5, comment: "Perfect for Thanksgiving" },
        { user: "James", rating: 4.5, comment: "Best pumpkin pie recipe" }
      ]
    }
  ];

  // Initialize selectedIngredients with all ingredients checked
  useEffect(() => {
    const allIngredients = [
      'eggs', 'milk', 'butter', 'flour', 'sugar', 'baking powder', 
      'salt', 'vanilla extract', 'chocolate', 'nuts', 'fruit', 'vegetables'
    ];
    setSelectedIngredients(allIngredients);
    
    // Initialize click counts for recipes
    const recipesWithClicks = mockRecipes.map(recipe => ({
      ...recipe,
      clicks: localStorage.getItem(`recipe_${recipe.id}_clicks`) || 0
    }));
    
    // Sort recipes by clicks and get top 4
    const sortedByPopularity = [...recipesWithClicks]
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 4);
    
    setPopularRecipes(sortedByPopularity);
  }, []);

  const handleSearch = () => {
    const query = searchQuery.toLowerCase();
    const filteredRecipes = mockRecipes.filter(recipe => {
      // Check if recipe matches search query
      const titleMatch = recipe.title.toLowerCase().includes(query);
      const ingredientMatch = recipe.ingredients.some(ingredient => 
        ingredient.toLowerCase().includes(query)
      );
      
      // Check if recipe contains any excluded ingredients
      const hasExcludedIngredient = recipe.ingredients.some(recipeIngredient => {
        const normalizedRecipeIngredient = recipeIngredient.toLowerCase();
        return !selectedIngredients.some(selected => 
          normalizedRecipeIngredient.includes(selected.toLowerCase())
        );
      });

      // Return true if:
      // 1. The recipe matches the search query AND
      // 2. It doesn't contain any excluded ingredients
      return (titleMatch || ingredientMatch) && !hasExcludedIngredient;
    });
    setSearchResults(filteredRecipes);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleIngredientToggle = (ingredient) => {
    setSelectedIngredients(prev => {
      if (prev.includes(ingredient)) {
        // If ingredient is already selected, remove it
        return prev.filter(item => item !== ingredient);
      } else {
        // If ingredient is not selected, add it
        return [...prev, ingredient];
      }
    });
  };

  const handleRecipeClick = (recipe) => {
    // Increment click count
    const currentClicks = parseInt(localStorage.getItem(`recipe_${recipe.id}_clicks`) || 0);
    localStorage.setItem(`recipe_${recipe.id}_clicks`, currentClicks + 1);
    
    // Update popular recipes
    const updatedRecipes = popularRecipes.map(r => 
      r.id === recipe.id ? { ...r, clicks: currentClicks + 1 } : r
    );
    
    // Re-sort and update
    const sortedRecipes = [...updatedRecipes].sort((a, b) => b.clicks - a.clicks);
    setPopularRecipes(sortedRecipes);
    
    // Show recipe modal
    setSelectedRecipe({
      ...recipe,
      rating: recipe.rating || 0,
      reviews: recipe.reviews || []
    });
    setShowModal(true);
  };

  const handleAddReview = () => {
    if (newReview.user && newReview.comment && newReview.rating > 0) {
      const updatedRecipe = {
        ...selectedRecipe,
        reviews: [...selectedRecipe.reviews, newReview],
        rating: (
          (selectedRecipe.rating * selectedRecipe.reviews.length + newReview.rating) / 
          (selectedRecipe.reviews.length + 1)
        ).toFixed(1)
      };

      // Update the recipe in mockRecipes
      const updatedRecipes = mockRecipes.map(recipe => 
        recipe.id === selectedRecipe.id ? updatedRecipe : recipe
      );
      
      // Update the selected recipe
      setSelectedRecipe(updatedRecipe);
      
      // Reset the form
      setNewReview({ user: '', rating: 0, comment: '' });
      setShowReviewForm(false);
    }
  };

  return (
    <div className="home">
      <section className="hero">
        <div className="search-container">
          <h1>Baking is Whisk-Y Business</h1>
          <div className="search-wrapper">
            <input 
              type="text" 
              placeholder="Search recipes..." 
              className="search-bar"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <button className="search-button" onClick={handleSearch}>
              <i className="fas fa-search"></i>
            </button>
            <button 
              className={`filter-button ${showFilters ? 'active' : ''}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <i className="fas fa-filter"></i>
            </button>
          </div>
          {showFilters && (
            <div className="ingredient-filters">
              <h3>Exclude Ingredients</h3>
              <div className="ingredient-list">
                {[
                  'eggs', 'milk', 'butter', 'flour', 'sugar', 'baking powder', 
                  'salt', 'vanilla extract', 'chocolate', 'nuts', 'fruit', 'vegetables'
                ].map(ingredient => (
                  <label key={ingredient} className="ingredient-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedIngredients.includes(ingredient)}
                      onChange={() => handleIngredientToggle(ingredient)}
                    />
                    {ingredient}
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
        <p>Baking is Whisk-Y business!</p>
      </section>

      {searchResults.length > 0 && (
        <section className="search-results">
          <h2>Search Results</h2>
          <div className="recipe-grid">
            {searchResults.map(recipe => (
              <div 
                key={recipe.id} 
                className="recipe-card"
                onClick={() => handleRecipeClick(recipe)}
                style={{ backgroundColor: recipe.color }}
              >
                <h3>{recipe.title}</h3>
                <div className="recipe-preview">
                  <p>Ingredients: {recipe.ingredients.slice(0, 3).join(', ')}...</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {showModal && selectedRecipe && (
        <div className="recipe-modal">
          <div className="modal-content">
            <button className="close-button" onClick={() => setShowModal(false)}>
              <i className="fas fa-times"></i>
            </button>
            <div className="title-box">
              <h2>{selectedRecipe.title}</h2>
            </div>
            <div className="modal-layout">
              <div className="modal-image">
                <img src={selectedRecipe.image} alt={selectedRecipe.title} />
              </div>
              <div className="modal-details">
                <div className="ingredients-box">
                  <h3>Ingredients</h3>
                  <ul>
                    {selectedRecipe.ingredients && selectedRecipe.ingredients.map((ingredient, index) => (
                      <li key={index}>{ingredient}</li>
                    ))}
                  </ul>
                </div>
                <div className="instructions-box">
                  <h3>Instructions</h3>
                  <ol>
                    {selectedRecipe.instructions && selectedRecipe.instructions.map((instruction, index) => (
                      <li key={index}>{instruction}</li>
                    ))}
                  </ol>
                </div>
                <div className="ratings-box">
                  <h3>Ratings & Reviews</h3>
                  <div className="average-rating">
                    <div className="stars">
                      {[...Array(5)].map((_, i) => (
                        <i 
                          key={i} 
                          className={`fas fa-star ${i < Math.floor(selectedRecipe.rating) ? 'filled' : ''} ${i === Math.floor(selectedRecipe.rating) && selectedRecipe.rating % 1 !== 0 ? 'half' : ''}`}
                        ></i>
                      ))}
                    </div>
                    <span className="rating-value">{selectedRecipe.rating || '0.0'}</span>
                  </div>
                  
                  <button 
                    className="add-review-button"
                    onClick={() => setShowReviewForm(!showReviewForm)}
                  >
                    {showReviewForm ? 'Cancel' : 'Add Review'}
                  </button>

                  {showReviewForm && (
                    <div className="review-form">
                      <input
                        type="text"
                        placeholder="Your Name"
                        value={newReview.user}
                        onChange={(e) => setNewReview({ ...newReview, user: e.target.value })}
                      />
                      <div className="rating-input">
                        <span>Rating: </span>
                        {[...Array(5)].map((_, i) => (
                          <i
                            key={i}
                            className={`fas fa-star ${i < newReview.rating ? 'filled' : ''}`}
                            onClick={() => setNewReview({ ...newReview, rating: i + 1 })}
                          ></i>
                        ))}
                      </div>
                      <textarea
                        placeholder="Your Review"
                        value={newReview.comment}
                        onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                      />
                      <button 
                        className="submit-review-button"
                        onClick={handleAddReview}
                        disabled={!newReview.user || !newReview.comment || newReview.rating === 0}
                      >
                        Submit Review
                      </button>
                    </div>
                  )}

                  <div className="reviews-list">
                    {selectedRecipe.reviews && selectedRecipe.reviews.map((review, index) => (
                      <div key={index} className="review-item">
                        <div className="review-header">
                          <span className="review-user">{review.user}</span>
                          <div className="review-stars">
                            {[...Array(5)].map((_, i) => (
                              <i 
                                key={i} 
                                className={`fas fa-star ${i < review.rating ? 'filled' : ''}`}
                              ></i>
                            ))}
                          </div>
                        </div>
                        <p className="review-comment">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <section className="recipe-showcase">
        <h2>Popular Recipes</h2>
        <div className="recipe-blocks">
          {popularRecipes.map(recipe => (
            <div 
              key={recipe.id} 
              className="recipe-block"
              onClick={() => handleRecipeClick(recipe)}
            >
              <div className="block-content">
                <h3>{recipe.title}</h3>
                <p>Clicks: {recipe.clicks}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home; 