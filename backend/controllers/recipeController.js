import supabase from '../config/supabaseClient.js';

export const createRecipe = async (req, res) => {
    try {
        const { 
            name,           
            instructions,   
            description,    
            recipeTime,
            userid,
            ingredients = []
        } = req.body;

        // Log the received data
        console.log('Received recipe data:', {
            name,
            instructions,
            description,
            recipeTime,
            userid,
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
        
        // Insert the recipe with the generated ID and userid
        const { data: recipeData, error: recipeError } = await supabase
            .from('recipe')
            .insert([
                { 
                    recipeid: nextRecipeId,
                    name,
                    instructions,
                    description,
                    recipetime: recipeTimeInt,
                    userid: userid  // Adding userid to the recipe table
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
        if (userid) {
            const { error: savedError } = await supabase
                .from('saved_recipes')
                .insert([{
                    userid: userid,
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
        const { userid, recipeId, dateSaved } = req.body;
        console.log('Received save recipe request:', req.body);

        if (!userid || !recipeId) {
            return res.status(400).json({
                error: 'User ID and Recipe ID are required'
            });
        }

        // Check if recipe is already saved
        const { data: existingSave, error: checkError } = await supabase
            .from('saved_recipes')
            .select('*')
            .eq('userid', userid)
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
                userid: userid,
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
        const { search, dietary, userid } = req.query;
        
        console.log('Processing userid filter:', userid);
        
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

        // Filter by userid if provided - for "My Recipes" functionality
        if (userid) {
            console.log('Filtering recipes by userid:', userid);
            // Try to convert userid to a number if it's a string
            const useridNum = parseInt(userid, 10);
            if (!isNaN(useridNum)) {
                console.log('Using numeric userid for filtering:', useridNum);
                query = query.eq('userid', useridNum);
            } else {
                console.log('Using string userid for filtering:', userid);
                query = query.eq('userid', userid);
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
                imageUrl: recipe.imageUrl,
                averageRating: avgRating,
                userid: recipe.userid,
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

// Debug function to directly test querying by userid
export const debugGetUserRecipes = async (req, res) => {
    try {
        const userid = req.params.userid;
        console.log('Debug - querying with userid:', userid);
        
        // Try different formats of userid to see which one works
        const useridNum = parseInt(userid, 10);
        console.log('Debug - userid as number:', useridNum);
        
        // Direct query with no joins to simplify debugging
        const { data: recipes, error } = await supabase
            .from('recipe')
            .select('*')
            .eq('userid', useridNum);
            
        console.log('Debug - direct query results:', {
            count: recipes?.length || 0,
            error: error
        });
        
        // Also try with the original string value
        const { data: recipes2, error: error2 } = await supabase
            .from('recipe')
            .select('*')
            .eq('userid', userid);
            
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
        const userid = req.params.userid;
        console.log('Getting saved recipes for userid:', userid);
        
        if (!userid) {
            return res.status(400).json({
                error: 'User ID is required'
            });
        }

        // Convert userid to number for consistency
        const useridNum = parseInt(userid, 10);
        
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
            .eq('userid', useridNum)
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

// Function to get all ratings created by a specific user
export const getUserRatings = async (req, res) => {
    try {
        const userid = req.params.userid;
        console.log('Getting ratings for userid:', userid);
        
        if (!userid) {
            return res.status(400).json({
                error: 'User ID is required'
            });
        }

        // Convert userid to number for consistency
        const useridNum = parseInt(userid, 10);
        
        // Join ratings with recipe table to get recipe details
        const { data: ratings, error } = await supabase
            .from('rating')
            .select(`
                ratingid,
                recipeid,
                score,
                dateposted,
                reviewtext,
                recipe:recipeid (
                    recipeid,
                    name,
                    description
                )
            `)
            .eq('userid', useridNum)
            .order('dateposted', { ascending: false });
            
        if (error) {
            console.error('Error fetching user ratings:', error);
            return res.status(400).json({
                error: 'Failed to fetch user ratings',
                details: error.message
            });
        }

        // Format the response to match our activity format
        const formattedRatings = ratings.map(rating => ({
            id: rating.ratingid,
            recipe_id: rating.recipeid,
            recipe_name: rating.recipe.name,
            rating: rating.score,
            review: rating.reviewtext,
            created_at: rating.dateposted
        }));
        
        res.status(200).json(formattedRatings);
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({
            error: 'An unexpected error occurred',
            details: error.message
        });
    }
};

// Upload recipe image
export const uploadRecipeImage = async (req, res) => {
    try {
        console.log('Recipe image upload request received');
        
        const { recipeId } = req.params;
        const { file } = req.body;
        
        console.log('Request params:', { recipeId });
        console.log('File received:', file ? `${file.substring(0, 40)}... (${file.length} chars)` : 'No file');
        
        if (!recipeId || !file) {
            console.error('Missing required params:', { hasRecipeId: !!recipeId, hasFile: !!file });
            return res.status(400).json({ 
                error: 'Recipe ID and file are required' 
            });
        }

        // Get recipe from database to verify it exists
        console.log('Fetching recipe with ID:', recipeId);
        const { data: recipe, error: recipeError } = await supabase
            .from('recipe')
            .select('recipeid, userid')
            .eq('recipeid', recipeId)
            .single();

        if (recipeError || !recipe) {
            console.error('Error fetching recipe:', recipeError?.message || 'Recipe not found');
            return res.status(404).json({ 
                error: 'Recipe not found',
                details: recipeError?.message || 'Recipe does not exist'
            });
        }

        console.log('Recipe found:', recipe);
        
        if (!recipe.userid) {
            console.error('Recipe has no associated userid');
            return res.status(400).json({
                error: 'Recipe has no associated user ID',
                details: 'Cannot store image without user ID'
            });
        }

        // Decode base64 file
        console.log('Decoding base64 file');
        let fileData;
        try {
            // Make sure to handle different base64 formats
            let base64Part = file;
            if (file.includes(',')) {
                base64Part = file.split(',')[1];
            }
            fileData = Buffer.from(base64Part, 'base64');
            console.log('File decoded, size:', fileData.length, 'bytes');
        } catch (decodeError) {
            console.error('Error decoding file:', decodeError);
            return res.status(400).json({
                error: 'Invalid file format',
                details: 'Could not decode base64 file'
            });
        }
        
        // Get file extension from MIME type
        let fileExtension = 'jpg'; // Default to jpg
        try {
            if (file.includes('image/')) {
                const mimeType = file.split(';')[0].split(':')[1].trim();
                fileExtension = mimeType.split('/')[1];
                console.log('File MIME type:', mimeType, 'Extension:', fileExtension);
            } else {
                console.log('Using default extension:', fileExtension);
            }
        } catch (mimeError) {
            console.error('Error parsing MIME type, using default:', mimeError);
        }
        
        // Create a file path using the user ID from the recipe record
        const filePath = `${recipe.userid}/recipes/${recipeId}.${fileExtension}`;
        console.log('Generated file path for storage:', filePath);

        try {
            // Check if the bucket exists
            const { data: buckets } = await supabase.storage.listBuckets();
            console.log('Available buckets:', buckets);
            
            // Upload to Supabase Storage using recipe-photos bucket
            console.log('Uploading to Supabase storage bucket: recipe-photos');
            
            // Set content type correctly
            let contentType = 'image/jpeg'; // default
            if (file.includes('data:')) {
                const mimeMatch = file.match(/data:([^;]+);/);
                if (mimeMatch && mimeMatch[1]) {
                    contentType = mimeMatch[1];
                }
            }
            console.log('Using content type:', contentType);
            
            const { data, error } = await supabase
                .storage
                .from('recipe-photos')
                .upload(filePath, fileData, {
                    contentType,
                    upsert: true
                });

            if (error) {
                console.error('Supabase storage upload error:', error);
                console.error('Error details:', error.message);
                return res.status(500).json({ 
                    error: 'Failed to upload image',
                    details: error.message
                });
            }

            console.log('Upload successful, storage response:', data);

            // Get public URL
            console.log('Getting public URL for file');
            const publicUrlData = supabase
                .storage
                .from('recipe-photos')
                .getPublicUrl(filePath);
            
            console.log('Public URL data from Supabase:', publicUrlData);
            
            // Extract the URL from the object (depending on Supabase version)
            let publicURL = '';
            if (publicUrlData.data && publicUrlData.data.publicUrl) {
                publicURL = publicUrlData.data.publicUrl;
            } else if (publicUrlData.publicURL) {
                publicURL = publicUrlData.publicURL;
            } else if (typeof publicUrlData === 'string') {
                publicURL = publicUrlData;
            }
            
            console.log('Generated public URL:', publicURL);

            if (!publicURL) {
                console.error('Failed to generate public URL');
                return res.status(500).json({ 
                    error: 'Failed to generate public URL for image' 
                });
            }

            // Update recipe with new image URL - using imageUrl for database column name
            console.log('Updating recipe with image URL in imageurl column');
            const { data: updateData, error: updateError } = await supabase
                .from('recipe')
                .update({ imageurl: publicURL })
                .eq('recipeid', recipeId)
                .select();

            if (updateError) {
                console.error('Error updating recipe with image URL:', updateError);
                return res.status(500).json({ 
                    error: 'Failed to update recipe with image URL',
                    details: updateError.message
                });
            }

            console.log('Recipe updated successfully:', updateData);
            
            // Send back the image URL as both formats for compatibility
            return res.json({ 
                message: 'Recipe image uploaded successfully',
                imageurl: publicURL,
                imageUrl: publicURL // Include both formats for compatibility
            });
            
        } catch (storageError) {
            console.error('Storage operation error:', storageError);
            return res.status(500).json({ 
                error: 'Storage operation failed',
                details: storageError.message
            });
        }
    } catch (error) {
        console.error('Unexpected server error in uploadRecipeImage:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({
            error: 'An unexpected error occurred',
            details: error.message
        });
    }
};