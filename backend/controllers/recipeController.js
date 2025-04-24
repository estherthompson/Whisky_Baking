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

        console.log('Received recipe data:', {
            name,
            instructions,
            description,
            recipeTime,
            userid,
            ingredientsCount: ingredients.length
        });

        const recipeTimeInt = parseInt(recipeTime, 10);
        if (isNaN(recipeTimeInt)) {
            console.log('Invalid recipeTime value:', recipeTime);
            return res.status(400).json({ 
                error: 'Recipe time must be a valid number',
                details: 'The provided recipe time could not be converted to an integer'
            });
        }

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
        
        const { data: recipeData, error: recipeError } = await supabase
            .from('recipe')
            .insert([
                { 
                    recipeid: nextRecipeId,
                    name,
                    instructions,
                    description,
                    recipetime: recipeTimeInt,
                    userid: userid  
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

        if (ingredients && ingredients.length > 0) {
            console.log('Processing ingredients:', ingredients.length);
            
            const recipeIngredients = [];
            
            for (const ing of ingredients) {
                let ingredientId = ing.ingredientId;
                
                if (!ingredientId) {
                    const { data: existingIng } = await supabase
                        .from('ingredient')
                        .select('ingredientid')
                        .ilike('name', ing.name)
                        .maybeSingle();
                    
                    if (existingIng) {
                        ingredientId = existingIng.ingredientid;
                        console.log(`Using existing ingredient: ${ing.name}, ID: ${ingredientId}`);
                    } else {
                        const { data: lastIng } = await supabase
                            .from('ingredient')
                            .select('ingredientid')
                            .order('ingredientid', { ascending: false })
                            .limit(1)
                            .maybeSingle();
                            
                        const nextIngId = lastIng ? lastIng.ingredientid + 1 : 1;
                        

                        const { data: newIng, error: newIngError } = await supabase
                            .from('ingredient')
                            .insert([
                                {
                                    ingredientid: nextIngId,
                                    name: ing.name,
                                    category: 'Other' 
                                }
                            ])
                            .select()
                            .single();
                            
                        if (newIngError) {
                            console.error('Error creating ingredient:', newIngError);
                            continue; 
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
            
            if (recipeIngredients.length > 0) {
                console.log('Inserting recipe ingredients:', recipeIngredients);
                const { error: recipeIngError } = await supabase
                    .from('recipe_ingredient')
                    .insert(recipeIngredients);
                    
                if (recipeIngError) {
                    console.error('Error adding recipe ingredients:', recipeIngError);
                }
            }
        }

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
        const userid = req.body.userid || req.body.userId;
        const recipeId = req.body.recipeId;
        const dateSaved = req.body.dateSaved || req.body.datesaved;
        
        console.log('Received save recipe request:', {
            userid,
            recipeId,
            dateSaved,
            originalBody: req.body
        });

        if (!userid || !recipeId) {
            return res.status(400).json({
                error: 'User ID and Recipe ID are required'
            });
        }

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

        let averageRating = 0;
        if (recipe.rating && recipe.rating.length > 0) {
            const totalRating = recipe.rating.reduce((sum, r) => sum + r.score, 0);
            averageRating = totalRating / recipe.rating.length;
        }

        const ingredients = recipe.recipe_ingredient.map(ri => ({
            name: ri.ingredient.name,
            ingredientid: ri.ingredient.ingredientid,
            quantity: ri.quantity
        }));

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
        console.log('Raw query object:', JSON.stringify(req.query));
        
        const userid = req.query.userid;
        const search = req.query.search;
        const dietary = req.query.dietary;
        
        console.log('Processing userid filter (lowercase):', userid);
        console.log('Alternative check - userId (uppercase):', req.query.userId);
        
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

        if (search) {
            query = query.ilike('name', `%${search}%`);
        }

        if (dietary) {
            const restrictions = dietary.split(',');
            query = query.in('recipe_ingredient.ingredient.dietary_restriction_ingredient.dietary_restriction.name', restrictions);
        }

        if (userid) {
            console.log('Filtering recipes by userid:', userid);
            const useridNum = parseInt(userid, 10);
            if (!isNaN(useridNum)) {
                console.log('Using numeric userid for filtering:', useridNum);
                query = query.eq('userid', useridNum);
            } else {
                console.log('Using string userid for filtering:', userid);
                query = query.eq('userid', userid);
            }
        }

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

export const addRatingToRecipe = async (req, res) => {
    try {
        const { recipeid } = req.params;
        const { userid, score, reviewtext } = req.body;

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

        const { data: lastRating } = await supabase
            .from('rating')
            .select('ratingid')
            .order('ratingid', { ascending: false })
            .limit(1)
            .single();

        const nextRatingId = lastRating ? lastRating.ratingid + 1 : 1;

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



export const getSavedRecipes = async (req, res) => {
    try {
        const userid = req.params.userId; 
        console.log('Getting saved recipes for userId:', userid);
        
        if (!userid) {
            return res.status(400).json({
                error: 'User ID is required'
            });
        }

        const useridNum = parseInt(userid, 10);
        
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
                    userid,
                    imageurl
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

export const getUserRatings = async (req, res) => {
    try {
        const userId = req.params.userId;
        console.log('Getting ratings for userId:', userId);
        
        if (!userId) {
            return res.status(400).json({
                error: 'User ID is required'
            });
        }

        const userIdNum = parseInt(userId, 10);
        console.log('Using numeric userIdNum for query:', userIdNum);
        
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
            .eq('userid', userIdNum)
            .order('dateposted', { ascending: false });
            
        if (error) {
            console.error('Error fetching user ratings:', error);
            return res.status(400).json({
                error: 'Failed to fetch user ratings',
                details: error.message
            });
        }

        console.log(`Found ${ratings ? ratings.length : 0} ratings for user ${userId}`);
        
        if (ratings && ratings.length > 0) {
            console.log('First rating sample:', ratings[0]);
        }
        
        const formattedRatings = ratings.map(rating => ({
            id: rating.ratingid,
            recipe_id: rating.recipeid,
            recipe_name: rating.recipe ? rating.recipe.name : 'Unknown Recipe',
            rating: rating.score,
            review: rating.reviewtext || '',
            created_at: rating.dateposted
        }));
        
        console.log('Formatted ratings for response:', formattedRatings);
        res.status(200).json(formattedRatings);
    } catch (error) {
        console.error('Server error in getUserRatings:', error);
        res.status(500).json({
            error: 'An unexpected error occurred',
            details: error.message
        });
    }
};

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

        console.log('Decoding base64 file');
        let fileData;
        try {
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
        
        let fileExtension = 'jpg'; 
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
        
        const filePath = `${recipe.userid}/recipes/${recipeId}.${fileExtension}`;
        console.log('Generated file path for storage:', filePath);

        try {
            const { data: buckets } = await supabase.storage.listBuckets();
            console.log('Available buckets:', buckets);
            
            console.log('Uploading to Supabase storage bucket: recipe-photos');
            
            let contentType = 'image/jpeg'; 
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

            console.log('Getting public URL for file');
            const publicUrlData = supabase
                .storage
                .from('recipe-photos')
                .getPublicUrl(filePath);
            
            console.log('Public URL data from Supabase:', publicUrlData);
            
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
            
            return res.json({ 
                message: 'Recipe image uploaded successfully',
                imageurl: publicURL,
                imageUrl: publicURL 
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

export const deleteSavedRecipe = async (req, res) => {
    try {
        const userid = req.params.userId;
        const recipeid = req.params.recipeId;
        
        console.log('Delete saved recipe request received:', {
            userid,
            recipeid,
            params: req.params
        });
        
        if (!userid || !recipeid) {
            console.error('Missing required parameters:', { userid, recipeid });
            return res.status(400).json({
                error: 'User ID and Recipe ID are required'
            });
        }
        
        const useridNum = parseInt(userid, 10);
        const recipeidNum = parseInt(recipeid, 10);
        
        console.log('Converted IDs:', { useridNum, recipeidNum });
        
        console.log(`Attempting to delete saved recipe where userid=${useridNum} and recipeid=${recipeidNum}`);
        const { data, error } = await supabase
            .from('saved_recipes')
            .delete()
            .eq('userid', useridNum)
            .eq('recipeid', recipeidNum);
        
        if (error) {
            console.error('Error deleting saved recipe:', error);
            return res.status(400).json({
                error: 'Failed to delete saved recipe',
                details: error.message
            });
        }
        
        console.log('Delete operation successful, response:', data);
        return res.status(200).json({
            message: 'Recipe removed from saved recipes successfully'
        });
    } catch (error) {
        console.error('Server error in deleteSavedRecipe:', error);
        res.status(500).json({
            error: 'An unexpected error occurred',
            details: error.message
        });
    }
};