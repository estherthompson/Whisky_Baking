-- Insert Ingredients
INSERT INTO Ingredient (IngredientID, Name, Category, IsAllergen, NutritionInfo) VALUES
(1, 'All-Purpose Flour', 'Dry', true, 'Contains gluten'),
(2, 'Sugar', 'Sweetener', false, 'High in carbohydrates'),
(3, 'Butter', 'Dairy', true, 'Contains dairy'),
(4, 'Eggs', 'Protein', true, 'Contains eggs'),
(5, 'Milk', 'Dairy', true, 'Contains dairy'),
(6, 'Vanilla Extract', 'Flavoring', false, 'Alcohol-based extract'),
(7, 'Baking Powder', 'Leavening', false, 'Chemical leavening agent'),
(8, 'Salt', 'Seasoning', false, 'Sodium chloride'),
(9, 'Chocolate Chips', 'Sweet', false, 'Contains cocoa'),
(10, 'Bananas', 'Fruit', false, 'Rich in potassium'),
(11, 'Almond Flour', 'Dry', true, 'Gluten-free alternative'),
(12, 'Coconut Oil', 'Fat', false, 'Dairy-free alternative'),
(13, 'Flax Seeds', 'Seed', false, 'Egg substitute when mixed with water'),
(14, 'Almond Milk', 'Dairy Alternative', false, 'Dairy-free milk alternative');

-- Insert Recipes
INSERT INTO Recipe (RecipeID, Name, Instructions, Description, RecipeTime) VALUES
(1, 'Classic Vanilla Cake', 
'Preheat oven to 350°F (175°C).
Cream butter and sugar until light and fluffy.
Add eggs one at a time, beating well after each addition.
Mix in vanilla extract.
Combine flour, baking powder, and salt in a separate bowl.
Alternately add dry ingredients and milk to the butter mixture.
Pour batter into greased cake pans.
Bake for 25-30 minutes or until a toothpick comes out clean.',
'A classic vanilla cake that''s perfect for any occasion',
45),

(2, 'Chocolate Chip Cookies',
'Preheat oven to 375°F (190°C).
Cream together butter and sugars.
Beat in eggs and vanilla.
Mix in flour, baking soda, and salt.
Stir in chocolate chips.
Drop rounded tablespoons onto baking sheets.
Bake for 9 to 11 minutes.',
'Classic chocolate chip cookies that are soft and chewy',
30),

(3, 'Banana Bread',
'Preheat oven to 350°F (175°C).
Mash bananas in a large bowl.
Mix in melted butter, sugar, egg, and vanilla.
Add flour, baking soda, and salt.
Pour batter into a greased loaf pan.
Bake for 60 minutes or until a toothpick comes out clean.',
'Moist and delicious banana bread',
75);

-- Insert Recipe Ingredients
INSERT INTO Recipe_Ingredient (RecipeID, IngredientID, Quantity) VALUES
(1, 1, '2 cups'),
(1, 2, '1 1/2 cups'),
(1, 3, '1/2 cup'),
(1, 4, '3'),
(1, 5, '1 cup'),
(1, 6, '2 tsp'),
(1, 7, '1 tbsp'),
(1, 8, '1/2 tsp'),
(2, 1, '2 1/4 cups'),
(2, 2, '3/4 cup'),
(2, 3, '1 cup'),
(2, 4, '2'),
(2, 6, '1 tsp'),
(2, 7, '1 tsp'),
(2, 8, '1 tsp'),
(2, 9, '2 cups'),
(3, 1, '2 cups'),
(3, 2, '3/4 cup'),
(3, 3, '1/3 cup'),
(3, 4, '1'),
(3, 6, '1 tsp'),
(3, 7, '1 tsp'),
(3, 8, '1/2 tsp'),
(3, 10, '3 ripe');

-- Insert Dietary Restrictions
INSERT INTO Dietary_Restriction (RestrictionID, Name) VALUES
(1, 'Gluten-Free'),
(2, 'Dairy-Free'),
(3, 'Egg-Free'),
(4, 'Nut-Free'),
(5, 'Vegan');

-- Insert Dietary Restriction Ingredients
INSERT INTO Dietary_Restriction_Ingredient (RestrictionID, IngredientID) VALUES
(1, 1), -- All-Purpose Flour is not gluten-free
(2, 3), -- Butter is not dairy-free
(2, 5), -- Milk is not dairy-free
(3, 4); -- Eggs are not egg-free

-- Insert Ingredient Substitutions
INSERT INTO Ingredient_Substitution (IngredientID, SubstituteID) VALUES
(1, 11), -- All-Purpose Flour -> Almond Flour
(3, 12), -- Butter -> Coconut Oil
(4, 13), -- Eggs -> Flax Seeds
(5, 14); -- Milk -> Almond Milk

-- Insert Sample User
INSERT INTO User_Account (UserID, Name, Email, Password, IsAdmin) VALUES
(1, 'Admin User', 'admin@example.com', 'hashed_password', true);

-- Insert Sample Ratings
INSERT INTO Rating (RatingID, RecipeID, UserID, Score, DatePosted, ReviewText) VALUES
(1, 1, 1, 5, CURRENT_DATE, 'Best vanilla cake ever!'),
(2, 1, 1, 4, CURRENT_DATE, 'Great recipe, very moist'),
(3, 2, 1, 5, CURRENT_DATE, 'Perfect chocolate chip cookies'),
(4, 3, 1, 4, CURRENT_DATE, 'Delicious banana bread'); 