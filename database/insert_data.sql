-- Insert Dietary Restrictions
INSERT INTO Dietary_Restriction (RestrictionID, Name) VALUES
(1, 'Vegetarian'),
(2, 'Vegan'),
(3, 'Gluten-Free'),
(4, 'Dairy-Free'),
(5, 'Nut-Free'),
(6, 'Egg-Free'),
(7, 'Low-Sugar'),
(8, 'Keto'),
(9, 'Kosher'),
(10, 'Halal');

-- Connect ingredients to dietary restrictions
INSERT INTO Dietary_Restriction_Ingredient (RestrictionID, IngredientID) VALUES
-- Gluten-containing ingredients (for Gluten-Free restriction)
(3, 1),  -- All-Purpose Flour
(3, 2),  -- Whole Wheat Flour
(3, 3),  -- Cake Flour
(3, 4),  -- Oats (unless certified gluten-free)

-- Dairy ingredients (for Dairy-Free restriction)
(4, 9),  -- Butter
(4, 10), -- Milk
(4, 11), -- Heavy Cream
(4, 12), -- Cream Cheese
(4, 28), -- Milk Chocolate
(4, 29), -- White Chocolate

-- Nut ingredients (for Nut-Free restriction)
(5, 21), -- Almonds
(5, 22), -- Walnuts

-- Animal products (for Vegan restriction)
(2, 9),  -- Butter
(2, 10), -- Milk
(2, 11), -- Heavy Cream
(2, 12), -- Cream Cheese
(2, 13), -- Eggs
(2, 28), -- Milk Chocolate
(2, 29); -- White Chocolate

-- Now let's add some recipes that use these ingredients
INSERT INTO Recipe (RecipeID, Name, Instructions, Description, RecipeTime, ImageURL) VALUES
(1, 'Classic Chocolate Chip Cookies', 
'1. Preheat oven to 375°F
2. Cream 1 cup butter with 3/4 cup each granulated and brown sugar
3. Beat in 2 eggs and vanilla extract
4. Mix in dry ingredients: flour, baking soda, salt
5. Fold in chocolate chips
6. Drop by tablespoons onto baking sheets
7. Bake 9-11 minutes until golden brown',
'Soft and chewy chocolate chip cookies with crispy edges',
30,
'https://images.unsplash.com/photo-1558964123-0d0b6b32f0b4?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'),

(2, 'Vegan Banana Bread', 
'1. Preheat oven to 350°F
2. Mash 3 ripe bananas
3. Mix with vegetable oil, brown sugar, and vanilla
4. Combine flour, baking soda, cinnamon
5. Mix wet and dry ingredients
6. Bake in lined loaf pan for 50-60 minutes',
'Moist and delicious egg-free and dairy-free banana bread',
70,
'https://images.unsplash.com/photo-1609780447631-05b93e5a88ea?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'),

(3, 'Gluten-Free Dark Chocolate Cake', 
'1. Preheat oven to 350°F
2. Mix cocoa powder, gluten-free flour blend, baking powder
3. Combine wet ingredients: oil, eggs, vanilla
4. Mix until smooth
5. Bake in prepared pan for 30-35 minutes',
'Rich and decadent chocolate cake that happens to be gluten-free',
45,
'https://images.unsplash.com/photo-1571115177098-24ec42ed204d?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80');

-- Connect recipes with their ingredients
INSERT INTO Recipe_Ingredient (RecipeID, IngredientID, Quantity) VALUES
-- Classic Chocolate Chip Cookies
(1, 1, '2 1/4 cups'),    -- All-Purpose Flour
(1, 5, '3/4 cup'),       -- Granulated Sugar
(1, 6, '3/4 cup'),       -- Brown Sugar
(1, 9, '1 cup'),         -- Butter
(1, 13, '2 large'),      -- Eggs
(1, 16, '1 tsp'),        -- Baking Soda
(1, 18, '1 tsp'),        -- Vanilla Extract
(1, 28, '2 cups'),       -- Milk Chocolate

-- Vegan Banana Bread
(2, 1, '2 cups'),        -- All-Purpose Flour
(2, 6, '3/4 cup'),       -- Brown Sugar
(2, 14, '1/4 cup'),      -- Applesauce (egg replacer)
(2, 16, '1 tsp'),        -- Baking Soda
(2, 18, '1 tsp'),        -- Vanilla Extract
(2, 19, '1 tsp'),        -- Cinnamon
(2, 25, '3 medium'),     -- Bananas
(2, 30, '1/3 cup'),      -- Vegetable Oil

-- Gluten-Free Dark Chocolate Cake
(3, 13, '3 large'),      -- Eggs
(3, 15, '2 tsp'),        -- Baking Powder
(3, 18, '2 tsp'),        -- Vanilla Extract
(3, 20, '3/4 cup'),      -- Cocoa Powder
(3, 27, '1 cup'),        -- Dark Chocolate
(3, 30, '1/2 cup'),      -- Vegetable Oil
(3, 5, '1 1/2 cups');    -- Granulated Sugar 