import supabase from '../config/supabaseClient.js';

export const createRecipe = async (req, res) => {
    try {
        const { 
            name,           
            instructions,   
            description,    
            recipeTime,
            userId,
            ingredients = []
        } = req.body;

        // Log the received data
        console.log('Received recipe data:', {
            name,
            instructions,
            description,
            recipeTime,
            userId,
            ingredientsCount: ingredients.length
        });

        // Convert recipeTime to integer
        const recipeTimeInt = parseInt(recipeTime, 10);
        if (isNaN(recipeTimeInt)) {
            console.log('Invalid recipeTime value:', recipeTime);
            return res.status(400).json({ 
                error: 'Recipe time must be a valid number',
                details: 'The provided recipe time could not be converted to an integer'
            });
        }

        // Validate required fields
        if (!name || !instructions || !description || !recipeTimeInt) {
            const missingFields = [];
            if (!name) missingFields.push('name');
            if (!instructions) missingFields.push('instructions');
            if (!description) missingFields.push('description');
            if (!recipeTimeInt) missingFields.push('recipeTime');
            
            console.log('Missing required fields:', missingFields);
            return res.status(400).json({ 
                error: 'All fields are required',
                missingFields: missingFields
            });
        }

        // Get the last recipe ID to generate a new unique ID
        const { data: lastRecipe, error: lastRecipeError } = await supabase
            .from('recipe')
            .select('recipeid')
            .order('recipeid', { ascending: false })
            .limit(1)
            .single();

        if (lastRecipeError && lastRecipeError.code !== 'PGRST116') {
            console.error('Error fetching last recipe:', lastRecipeError);
            return res.status(500).json({ 
                error: 'Failed to generate recipe ID',
                details: lastRecipeError.message 
            });
        }

        const nextRecipeId = lastRecipe ? lastRecipe.recipeid + 1 : 1;
        console.log('Attempting to insert recipe with ID:', nextRecipeId);
        
        // Insert the recipe with the generated ID and userId
        const { data: recipeData, error: recipeError } = await supabase
            .from('recipe')
            .insert([
                { 
                    recipeid: nextRecipeId,
                    name,
                    instructions,
                    description,
                    recipetime: recipeTimeInt,
                    userid: userId  // Adding userId to the recipe table
                }
            ])
            .select()
            .single();

        if (recipeError) {
            console.error('Error creating recipe:', recipeError);
            return res.status(400).json({ 
                error: 'Failed to create recipe',
                details: recipeError.message 
            });
        }

        // Process ingredients and insert recipe_ingredient associations
        if (ingredients && ingredients.length > 0) {
            console.log('Processing ingredients:', ingredients.length);
            
            const recipeIngredients = [];
            
            for (const ing of ingredients) {
                let ingredientId = ing.ingredientId;
                
                // If no ingredient ID provided, check if it exists by name or create it
                if (!ingredientId) {
                    // Check if ingredient exists
                    const { data: existingIng } = await supabase
                        .from('ingredient')
                        .select('ingredientid')
                        .ilike('name', ing.name)
                        .maybeSingle();
                    
                    if (existingIng) {
                        // Use existing ingredient
                        ingredientId = existingIng.ingredientid;
                        console.log(`Using existing ingredient: ${ing.name}, ID: ${ingredientId}`);
                    } else {
                        // Get max ingredient ID to generate new ID
                        const { data: lastIng } = await supabase
                            .from('ingredient')
                            .select('ingredientid')
                            .order('ingredientid', { ascending: false })
                            .limit(1)
                            .maybeSingle();
                            
                        const nextIngId = lastIng ? lastIng.ingredientid + 1 : 1;
                        
                        // Create new ingredient
                        const { data: newIng, error: newIngError } = await supabase
                            .from('ingredient')
                            .insert([
                                {
                                    ingredientid: nextIngId,
                                    name: ing.name,
                                    category: 'Other' // Default category
                                }
                            ])
                            .select()
                            .single();
                            
                        if (newIngError) {
                            console.error('Error creating ingredient:', newIngError);
                            continue; // Skip this ingredient if error
                        }
                        
                        ingredientId = newIng.ingredientid;
                        console.log(`Created new ingredient: ${ing.name}, ID: ${ingredientId}`);
                    }
                }
                
                if (ingredientId) {
                    recipeIngredients.push({
                        recipeid: nextRecipeId,
                        ingredientid: ingredientId,
                        quantity: ing.quantity
                    });
                }
            }
            
            // Insert recipe_ingredient relationships if we have any
            if (recipeIngredients.length > 0) {
                console.log('Inserting recipe ingredients:', recipeIngredients);
                const { error: recipeIngError } = await supabase
                    .from('recipe_ingredient')
                    .insert(recipeIngredients);
                    
                if (recipeIngError) {
                    console.error('Error adding recipe ingredients:', recipeIngError);
                    // We won't fail the whole operation if ingredients fail
                }
            }
        }

        // We'll still save to saved_recipes for backward compatibility
        if (userId) {
            const { error: savedError } = await supabase
                .from('saved_recipes')
                .insert([{
                    userid: userId,
                    recipeid: nextRecipeId,
                    datesaved: new Date().toISOString()
                }]);

            if (savedError) {
                console.error('Error saving recipe for user:', savedError);
                // We don't need to fail the entire operation if this step fails
            }
        }

        res.status(201).json({
            ...recipeData,
            message: 'Recipe created successfully'
        });
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ 
            error: 'An unexpected error occurred',
            details: error.message 
        });
    }
};

export const savedRecipe = async (req, res) => {
    try {
        const { userId, recipeId, dateSaved } = req.body;
        console.log('Received save recipe request:', req.body);

        if (!userId || !recipeId) {
            return res.status(400).json({
                error: 'User ID and Recipe ID are required'
            });
        }

        // Check if recipe is already saved
        const { data: existingSave, error: checkError } = await supabase
            .from('saved_recipes')
            .select('*')
            .eq('userid', userId)
            .eq('recipeid', recipeId)
            .single();

        if (checkError && checkError.code !== 'PGRST116') {
            console.error('Error checking saved recipe:', checkError);
            return res.status(400).json({
                error: 'Failed to check saved recipe status',
                details: checkError.message
            });
        }

        if (existingSave) {
            return res.status(400).json({
                error: 'Recipe is already saved by this user'
            });
        }

        // Use the provided dateSaved or generate a new timestamp
        const dateToSave = dateSaved || new Date().toISOString();
        console.log('Saving recipe with date:', dateToSave);

        const { data: savedData, error: savedError } = await supabase
            .from('saved_recipes')
            .insert([{
                userid: userId,
                recipeid: recipeId,
                datesaved: dateToSave
            }])
            .select();

        if (savedError) {
            console.error('Error saving recipe:', savedError);
            return res.status(400).json({
                error: 'Failed to save recipe',
                details: savedError.message
            });
        }

        console.log('Successfully saved recipe:', savedData);
        res.status(201).json({
            message: 'Recipe saved successfully',
            data: savedData
        });
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({
            error: 'An unexpected error occurred',
            details: error.message
        });
    }
};

export const getRecipeById = async (req, res) => {
    try {
        const { id } = req.params;

        // Get recipe with ingredients and ratings
        const { data: recipe, error: recipeError } = await supabase
            .from('recipe')
            .select(`
                *,
                recipe_ingredient (
                    quantity,
                    ingredient (
                        name,
                        ingredientid
                    )
                ),
                rating (
                    ratingid,
                    score,
                    reviewtext,
                    dateposted,
                    user_account (
                        name
                    )
                )
            `)
            .eq('recipeid', id)
            .single();

        if (recipeError) {
            console.error('Error fetching recipe:', recipeError);
            return res.status(404).json({
                error: 'Recipe not found',
                details: recipeError.message
            });
        }

        // Calculate average rating
        let averageRating = 0;
        if (recipe.rating && recipe.rating.length > 0) {
            const totalRating = recipe.rating.reduce((sum, r) => sum + r.score, 0);
            averageRating = totalRating / recipe.rating.length;
        }

        // Format ingredients
        const ingredients = recipe.recipe_ingredient.map(ri => ({
            name: ri.ingredient.name,
            ingredientid: ri.ingredient.ingredientid,
            quantity: ri.quantity
        }));

        // Format the response
        const formattedRecipe = {
            ...recipe,
            ingredients,
            averageRating,
            ratings: recipe.rating || []
        };

        delete formattedRecipe.recipe_ingredient;
        delete formattedRecipe.rating;

        res.json(formattedRecipe);

    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({
            error: 'An unexpected error occurred',
            details: error.message
        });
    }
};

export const getAllRecipes = async (req, res) => {
    try {
        console.log('Fetching recipes with filters:', req.query);
        const { search, dietary, userId } = req.query;
        
        console.log('Processing userId filter:', userId);
        
        // Start building the query
        let query = supabase
            .from('recipe')
            .select(`
                *,
                recipe_ingredient (
                    ingredient (
                        name,
                        dietary_restriction_ingredient (
                            dietary_restriction (name)
                        )
                    )
                ),
                rating (score)
            `);

        // Apply search filter if provided
        if (search) {
            query = query.ilike('name', `%${search}%`);
        }

        // Apply dietary restrictions filter if provided
        if (dietary) {
            const restrictions = dietary.split(',');
            query = query.in('recipe_ingredient.ingredient.dietary_restriction_ingredient.dietary_restriction.name', restrictions);
        }

        // Filter by userId if provided - for "My Recipes" functionality
        if (userId) {
            console.log('Filtering recipes by userId:', userId);
            // Try to convert userId to a number if it's a string
            const userIdNum = parseInt(userId, 10);
            if (!isNaN(userIdNum)) {
                console.log('Using numeric userId for filtering:', userIdNum);
                query = query.eq('userid', userIdNum);
            } else {
                console.log('Using string userId for filtering:', userId);
                query = query.eq('userid', userId);
            }
        }

        // Execute the query
        const { data: recipes, error: recipesError } = await query
            .order('recipeid', { ascending: false });

        console.log('Query result - recipes count:', recipes?.length || 0);
        if (recipesError) {
            console.error('Error fetching recipes:', recipesError);
            return res.status(500).json({ 
                error: 'Failed to fetch recipes',
                details: recipesError.message 
            });
        }

        // Calculate average ratings and format response
        const formattedRecipes = recipes.map(recipe => {
            const avgRating = recipe.rating && recipe.rating.length > 0
                ? (recipe.rating.reduce((acc, curr) => acc + curr.score, 0) / recipe.rating.length).toFixed(1)
                : null;

            return {
                recipeid: recipe.recipeid,
                name: recipe.name,
                description: recipe.description,
                recipetime: recipe.recipetime,
                image_url: recipe.image_url,
                rating: avgRating,
                userid: recipe.userid, // Include the userid in the response
                dietary_restrictions: recipe.recipe_ingredient 
                    ? [...new Set(
                        recipe.recipe_ingredient
                            .flatMap(ri => 
                                ri.ingredient?.dietary_restriction_ingredient 
                                ? ri.ingredient.dietary_restriction_ingredient
                                    .map(dri => dri.dietary_restriction?.name)
                                    .filter(Boolean)
                                : []
                            )
                        )]
                    : []
            };
        });

        console.log('Sending formatted recipes count:', formattedRecipes.length);
        res.status(200).json(formattedRecipes);
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ 
            error: 'An unexpected error occurred',
            details: error.message 
        });
    }
};

// Add this new function to handle creating a rating for a recipe
export const addRatingToRecipe = async (req, res) => {
    try {
        const { recipeid } = req.params;
        const { userid, score, reviewtext } = req.body;

        // First check if recipe exists
        const { data: recipe, error: recipeError } = await supabase
            .from('recipe')
            .select('recipeid')
            .eq('recipeid', recipeid)
            .single();

        if (recipeError || !recipe) {
            return res.status(404).json({
                error: 'Recipe not found',
                details: recipeError?.message || 'Recipe does not exist'
            });
        }

        // Check if user has already rated this recipe
        const { data: existingRating, error: checkError } = await supabase
            .from('rating')
            .select('ratingid')
            .eq('recipeid', recipeid)
            .eq('userid', userid)
            .single();

        if (existingRating) {
            return res.status(400).json({
                error: 'User has already rated this recipe'
            });
        }

        // Get the last rating ID
        const { data: lastRating } = await supabase
            .from('rating')
            .select('ratingid')
            .order('ratingid', { ascending: false })
            .limit(1)
            .single();

        const nextRatingId = lastRating ? lastRating.ratingid + 1 : 1;

        // Create the new rating
        const { data: rating, error } = await supabase
            .from('rating')
            .insert([
                {
                    ratingid: nextRatingId,
                    recipeid,
                    userid,
                    score,
                    dateposted: new Date().toISOString().split('T')[0],
                    reviewtext
                }
            ])
            .select()
            .single();

        if (error) {
            console.error('Error creating rating:', error);
            return res.status(400).json({
                error: 'Failed to create rating',
                details: error.message
            });
        }

        res.status(201).json({
            message: 'Rating added successfully',
            rating
        });

    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({
            error: 'An unexpected error occurred',
            details: error.message
        });
    }
};

// Debug function to directly test querying by userId
export const debugGetUserRecipes = async (req, res) => {
    try {
        const userId = req.params.userId;
        console.log('Debug - querying with userId:', userId);
        
        // Try different formats of userId to see which one works
        const userIdNum = parseInt(userId, 10);
        console.log('Debug - userId as number:', userIdNum);
        
        // Direct query with no joins to simplify debugging
        const { data: recipes, error } = await supabase
            .from('recipe')
            .select('*')
            .eq('userid', userIdNum);
            
        console.log('Debug - direct query results:', {
            count: recipes?.length || 0,
            error: error
        });
        
        // Also try with the original string value
        const { data: recipes2, error: error2 } = await supabase
            .from('recipe')
            .select('*')
            .eq('userid', userId);
            
        console.log('Debug - string value query results:', {
            count: recipes2?.length || 0,
            error: error2
        });
        
        // Send the response with the number results
        res.status(200).json({
            message: 'Debug query results',
            numberResults: recipes || [],
            stringResults: recipes2 || []
        });
    } catch (error) {
        console.error('Debug query error:', error);
        res.status(500).json({
            error: 'Debug query failed',
            details: error.message
        });
    }
};

// Function to get all saved recipes for a specific user
export const getSavedRecipes = async (req, res) => {
    try {
        const userId = req.params.userId;
        console.log('Getting saved recipes for userId:', userId);
        
        if (!userId) {
            return res.status(400).json({
                error: 'User ID is required'
            });
        }

        // Convert userId to number for consistency
        const userIdNum = parseInt(userId, 10);
        
        // Join saved_recipes with recipe table to get full recipe details
        const { data: savedRecipes, error } = await supabase
            .from('saved_recipes')
            .select(`
                recipeid,
                datesaved,
                recipe:recipeid (
                    recipeid,
                    name,
                    description,
                    instructions,
                    recipetime,
                    userid
                )
            `)
            .eq('userid', userIdNum)
            .order('datesaved', { ascending: false });
            
        if (error) {
            console.error('Error fetching saved recipes:', error);
            return res.status(400).json({
                error: 'Failed to fetch saved recipes',
                details: error.message
            });
        }

        // Format the response to be more client-friendly
        const formattedRecipes = savedRecipes.map(item => ({
            ...item.recipe,
            dateSaved: item.datesaved
        }));
        
        res.status(200).json({
            count: formattedRecipes.length,
            recipes: formattedRecipes
        });
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({
            error: 'An unexpected error occurred',
            details: error.message
        });
    }
};