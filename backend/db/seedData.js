// Initial data for the database
const initialData = {
  ingredients: [
    { id: 1, name: "All-Purpose Flour", category: "Dry", isAllergen: true, nutritionInfo: "Contains gluten" },
    { id: 2, name: "Sugar", category: "Sweetener", isAllergen: false, nutritionInfo: "High in carbohydrates" },
    { id: 3, name: "Butter", category: "Dairy", isAllergen: true, nutritionInfo: "Contains dairy" },
    { id: 4, name: "Eggs", category: "Protein", isAllergen: true, nutritionInfo: "Contains eggs" },
    { id: 5, name: "Milk", category: "Dairy", isAllergen: true, nutritionInfo: "Contains dairy" },
    { id: 6, name: "Vanilla Extract", category: "Flavoring", isAllergen: false, nutritionInfo: "Alcohol-based extract" },
    { id: 7, name: "Baking Powder", category: "Leavening", isAllergen: false, nutritionInfo: "Chemical leavening agent" },
    { id: 8, name: "Salt", category: "Seasoning", isAllergen: false, nutritionInfo: "Sodium chloride" },
    { id: 9, name: "Chocolate Chips", category: "Sweet", isAllergen: false, nutritionInfo: "Contains cocoa" },
    { id: 10, name: "Bananas", category: "Fruit", isAllergen: false, nutritionInfo: "Rich in potassium" }
  ],

  recipes: [
    {
      id: 1,
      name: "Classic Vanilla Cake",
      instructions: [
        "Preheat oven to 350°F (175°C).",
        "Cream butter and sugar until light and fluffy.",
        "Add eggs one at a time, beating well after each addition.",
        "Mix in vanilla extract.",
        "Combine flour, baking powder, and salt in a separate bowl.",
        "Alternately add dry ingredients and milk to the butter mixture.",
        "Pour batter into greased cake pans.",
        "Bake for 25-30 minutes or until a toothpick comes out clean."
      ].join('\n'),
      description: "A classic vanilla cake that's perfect for any occasion",
      recipeTime: 45
    },
    {
      id: 2,
      name: "Chocolate Chip Cookies",
      instructions: [
        "Preheat oven to 375°F (190°C).",
        "Cream together butter and sugars.",
        "Beat in eggs and vanilla.",
        "Mix in flour, baking soda, and salt.",
        "Stir in chocolate chips.",
        "Drop rounded tablespoons onto baking sheets.",
        "Bake for 9 to 11 minutes."
      ].join('\n'),
      description: "Classic chocolate chip cookies that are soft and chewy",
      recipeTime: 30
    },
    {
      id: 3,
      name: "Banana Bread",
      instructions: [
        "Preheat oven to 350°F (175°C).",
        "Mash bananas in a large bowl.",
        "Mix in melted butter, sugar, egg, and vanilla.",
        "Add flour, baking soda, and salt.",
        "Pour batter into a greased loaf pan.",
        "Bake for 60 minutes or until a toothpick comes out clean."
      ].join('\n'),
      description: "Moist and delicious banana bread",
      recipeTime: 75
    }
  ],

  recipeIngredients: [
    { recipeId: 1, ingredientId: 1, quantity: "2 cups" },
    { recipeId: 1, ingredientId: 2, quantity: "1 1/2 cups" },
    { recipeId: 1, ingredientId: 3, quantity: "1/2 cup" },
    { recipeId: 1, ingredientId: 4, quantity: "3" },
    { recipeId: 1, ingredientId: 5, quantity: "1 cup" },
    { recipeId: 1, ingredientId: 6, quantity: "2 tsp" },
    { recipeId: 1, ingredientId: 7, quantity: "1 tbsp" },
    { recipeId: 1, ingredientId: 8, quantity: "1/2 tsp" },
    { recipeId: 2, ingredientId: 1, quantity: "2 1/4 cups" },
    { recipeId: 2, ingredientId: 2, quantity: "3/4 cup" },
    { recipeId: 2, ingredientId: 3, quantity: "1 cup" },
    { recipeId: 2, ingredientId: 4, quantity: "2" },
    { recipeId: 2, ingredientId: 6, quantity: "1 tsp" },
    { recipeId: 2, ingredientId: 7, quantity: "1 tsp" },
    { recipeId: 2, ingredientId: 8, quantity: "1 tsp" },
    { recipeId: 2, ingredientId: 9, quantity: "2 cups" },
    { recipeId: 3, ingredientId: 1, quantity: "2 cups" },
    { recipeId: 3, ingredientId: 2, quantity: "3/4 cup" },
    { recipeId: 3, ingredientId: 3, quantity: "1/3 cup" },
    { recipeId: 3, ingredientId: 4, quantity: "1" },
    { recipeId: 3, ingredientId: 6, quantity: "1 tsp" },
    { recipeId: 3, ingredientId: 7, quantity: "1 tsp" },
    { recipeId: 3, ingredientId: 8, quantity: "1/2 tsp" },
    { recipeId: 3, ingredientId: 10, quantity: "3 ripe" }
  ],

  dietaryRestrictions: [
    { id: 1, name: "Gluten-Free" },
    { id: 2, name: "Dairy-Free" },
    { id: 3, name: "Egg-Free" },
    { id: 4, name: "Nut-Free" },
    { id: 5, name: "Vegan" }
  ],

  dietaryRestrictionIngredients: [
    { restrictionId: 1, ingredientId: 1 }, // All-Purpose Flour is not gluten-free
    { restrictionId: 2, ingredientId: 3 }, // Butter is not dairy-free
    { restrictionId: 2, ingredientId: 5 }, // Milk is not dairy-free
    { restrictionId: 3, ingredientId: 4 }  // Eggs are not egg-free
  ],

  ingredientSubstitutions: [
    { ingredientId: 1, substituteId: 11 }, // All-Purpose Flour -> Almond Flour
    { ingredientId: 3, substituteId: 12 }, // Butter -> Coconut Oil
    { ingredientId: 4, substituteId: 13 }, // Eggs -> Flax Eggs
    { ingredientId: 5, substituteId: 14 }  // Milk -> Almond Milk
  ]
};

module.exports = initialData; 