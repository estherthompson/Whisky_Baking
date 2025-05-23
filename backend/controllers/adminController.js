import supabase from '../config/supabaseClient.js';

export const getTotalUsers = async (req, res) => {
    try {
        const { count, error } = await supabase
            .from('user_account')
            .select('userid', { count: 'exact', head: true });

        if (error) {
            console.error('Error fetching total users:', error);
            return res.status(500).json({ error: 'Failed to fetch total users' });
        }

        res.json({ totalUsers: count });
    } catch (error) {
        console.error('Error in getTotalUsers:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getTotalAdmins = async (req, res) => {
    try {
        const { count, error } = await supabase
            .from('user_account')
            .select('userid', { count: 'exact', head: true })
            .eq('isadmin', true);

        if (error) {
            console.error('Error fetching total admins:', error);
            return res.status(500).json({ error: 'Failed to fetch total admins' });
        }

        res.json({ totalAdmins: count });
    } catch (error) {
        console.error('Error in getTotalAdmins:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getTotalRecipes = async (req, res) => {
    try {
        const { count, error } = await supabase
            .from('recipe')
            .select('recipeid', { count: 'exact', head: true });
        
        if (error) {
            console.error('Error fetching total recipes:', error);
            return res.status(500).json({ error: 'Failed to fetch total recipes' });
        }

        res.json({ totalRecipes: count });
    } catch (error) {
        console.error('Error in getTotalRecipes:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getPendingRecipes = async (req, res) => {
    try {
        console.log('Fetching pending recipes...');
        let { data: recipes, error } = await supabase
            .from('recipe')
            .select('*')
            .eq('is_approved', false);
            
        if (error) {
            console.error('Error fetching pending recipes:', error);
            return res.status(500).json({ error: 'Failed to fetch pending recipes' });
        }
        
        console.log(`Found ${recipes?.length || 0} pending recipes`);
        
        if (recipes && recipes.length > 0) {
            const recipesWithIngredients = [];
            
            for (const recipe of recipes) {
                console.log(`Processing recipe ${recipe.recipeid}: ${recipe.name || 'Unnamed'}`);
                
                const { data: tableInfo, error: tableError } = await supabase
                    .from('recipe_ingredient')
                    .select('*')
                    .limit(1);
                
                if (tableError) {
                    console.error('Error fetching recipe_ingredient table info:', tableError);
                } else {
                    console.log('recipe_ingredient table columns:', tableInfo && tableInfo[0] ? Object.keys(tableInfo[0]) : []);
                }
                
                console.log(`Fetching ingredients for recipe ${recipe.recipeid}...`);
                const { data: recipeIngredients, error: ingredientsError } = await supabase
                    .from('recipe_ingredient')
                    .select('*')  
                    .eq('recipeid', recipe.recipeid);
                
                if (ingredientsError) {
                    console.error(`Error fetching ingredients for recipe ${recipe.recipeid}:`, ingredientsError);
                }
                
                console.log(`Found ${recipeIngredients?.length || 0} ingredients for recipe ${recipe.recipeid}`);
                
                if (recipeIngredients && recipeIngredients.length > 0) {
                    console.log('Sample ingredient data:', recipeIngredients[0]);
                } else {
                    console.log('Trying alternate column name (recipe_id) for ingredients...');
                    const { data: altIngredients, error: altError } = await supabase
                        .from('recipe_ingredient')
                        .select('*')
                        .eq('recipe_id', recipe.recipeid);
                        
                    if (altError) {
                        console.error('Error with alternate column name:', altError);
                    } else {
                        console.log(`Found ${altIngredients?.length || 0} ingredients with alternate column name`);
                        if (altIngredients && altIngredients.length > 0) {
                            console.log('Sample ingredient data with alternate column:', altIngredients[0]);
                            recipeIngredients = altIngredients;
                        }
                    }
                }
                
                let ingredientsWithNames = [];
                if (recipeIngredients && recipeIngredients.length > 0) {
                    const ingredientIdField = recipeIngredients[0].hasOwnProperty('ingredientid') 
                        ? 'ingredientid' 
                        : recipeIngredients[0].hasOwnProperty('ingredient_id')
                            ? 'ingredient_id'
                            : null;
                            
                    console.log('Using ingredient ID field:', ingredientIdField);
                    
                    if (ingredientIdField) {
                        const ingredientIds = recipeIngredients.map(item => item[ingredientIdField]);
                        console.log('Ingredient IDs to look up:', ingredientIds);
                        
                        const { data: ingTableInfo, error: ingTableError } = await supabase
                            .from('ingredient')
                            .select('*')
                            .limit(1);
                        
                        if (ingTableError) {
                            console.error('Error fetching ingredient table info:', ingTableError);
                        } else {
                            console.log('ingredient table columns:', ingTableInfo && ingTableInfo[0] ? Object.keys(ingTableInfo[0]) : []);
                        }
                        
                        console.log('Fetching ingredient names...');
                        const { data: ingredientNames, error: namesError } = await supabase
                            .from('ingredient')
                            .select('*')
                            .in(ingredientIdField, ingredientIds);
                            
                        if (namesError) {
                            console.error(`Error fetching ingredient names:`, namesError);
                        }
                        
                        console.log(`Found ${ingredientNames?.length || 0} ingredient names`);
                        
                        const ingredientMap = {};
                        if (ingredientNames && ingredientNames.length > 0) {
                            console.log('Sample ingredient name data:', ingredientNames[0]);
                            
                            const nameField = ingredientNames[0].hasOwnProperty('name') 
                                ? 'name' 
                                : ingredientNames[0].hasOwnProperty('ingredient_name')
                                    ? 'ingredient_name'
                                    : Object.keys(ingredientNames[0])[1]; 
                                    
                            console.log('Using name field:', nameField);
                            
                            ingredientNames.forEach(ing => {
                                ingredientMap[ing[ingredientIdField]] = ing[nameField];
                            });
                        }
                        
                        ingredientsWithNames = recipeIngredients.map(item => {
                            const ingredientDetails = {
                                ...item,
                                name: ingredientMap[item[ingredientIdField]] || 'Unknown Ingredient'
                            };
                            console.log('Processed ingredient:', ingredientDetails);
                            return ingredientDetails;
                        });
                    } else {
                        console.error('Could not determine ingredient ID field name');
                        ingredientsWithNames = recipeIngredients;
                    }
                }
                
                recipesWithIngredients.push({
                    ...recipe,
                    ingredients: ingredientsWithNames || [],
                    _debug: {
                        ingredientsFound: recipeIngredients?.length || 0,
                        namesFound: ingredientsWithNames?.length || 0
                    }
                });
            }
            
            recipes = recipesWithIngredients;
        }
        
        console.log('Returning recipes response');
        res.json({ 
            recipes: recipes || [],
            debug: {
                recipeCount: recipes?.length || 0
            }
        });
    } catch (error) {
        console.error('Error in getPendingRecipes:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const approveRecipe = async (req, res) => {
    try {
        const { recipeId } = req.params;
        
        const { data, error } = await supabase
            .from('recipe')
            .update({ is_approved: true })
            .eq('recipeid', recipeId);
        
        if (error) {
            console.error("Error approving recipe:", error);
            return res.status(500).json({ error: error.message });
        }
        
        return res.status(200).json({ message: 'Recipe approved successfully' });
    } catch (error) {
        console.error("Error in approveRecipe:", error);
        return res.status(500).json({ error: error.message || 'An error occurred while approving the recipe' });
    }
};

export const rejectRecipe = async (req, res) => {
    try {
        const { recipeId } = req.params;
        
        const { data, error } = await supabase
            .from('recipe')
            .delete()
            .eq('recipeid', recipeId);
        
        if (error) {
            console.error("Error rejecting recipe:", error);
            return res.status(500).json({ error: error.message });
        }
        
        return res.status(200).json({ message: 'Recipe rejected and removed successfully' });
    } catch (error) {
        console.error("Error in rejectRecipe:", error);
        return res.status(500).json({ error: error.message || 'An error occurred while rejecting the recipe' });
    }
};

export const checkRecipeTable = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('recipe')
            .select('*')
            .limit(1);
        
        if (error) {
            console.error("Error fetching recipe table info:", error);
            return res.status(500).json({ error: error.message });
        }
        
        let schemaInfo = null;
        try {
            const { data: schemaData, error: schemaError } = await supabase
                .rpc('get_table_structure', { table_name: 'recipe' });
            
            if (!schemaError) {
                schemaInfo = schemaData;
            }
        } catch (schemaErr) {
            console.log("Failed to get schema via RPC: ", schemaErr);
        }
        
        return res.status(200).json({
            sampleData: data,
            columns: data && data[0] ? Object.keys(data[0]) : [],
            schemaInfo,
            tableExists: Boolean(data)
        });
    } catch (error) {
        console.error("Error in checkRecipeTable:", error);
        return res.status(500).json({ error: error.message || 'An error occurred while checking recipe table' });
    }
};

export const getTableInfo = async (req, res) => {
    try {
        const { tableName } = req.params;
        
        if (!tableName) {
            return res.status(400).json({ error: 'Table name is required' });
        }

        try {
            const { data: schemaData, error: schemaError } = await supabase
                .rpc('get_table_structure', { table_name: tableName });
            
            if (!schemaError && schemaData) {
                console.log(`Successfully retrieved ${tableName} structure via RPC`);
                return res.status(200).json({
                    tableName,
                    structure: schemaData,
                    source: 'rpc'
                });
            }
        } catch (rpcErr) {
            console.log(`Failed to get ${tableName} schema via RPC: `, rpcErr);
        }
        
        const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .limit(5); 
        
        if (error) {
            console.error(`Error fetching ${tableName} info:`, error);
            return res.status(500).json({ 
                error: error.message,
                tableName
            });
        }
        
        let extraInfo = {};
        if (tableName === 'user_account' && data && data.length > 0) {
            extraInfo = {
                auth_id_info: {
                    columnExists: data[0].hasOwnProperty('auth_id'),
                    caseVariants: {
                        'auth_id': data[0].hasOwnProperty('auth_id'),
                        'Auth_id': data[0].hasOwnProperty('Auth_id'),
                        'AUTH_ID': data[0].hasOwnProperty('AUTH_ID'),
                        'authId': data[0].hasOwnProperty('authId'),
                        'authid': data[0].hasOwnProperty('authid'),
                        'AuthId': data[0].hasOwnProperty('AuthId')
                    },
                    sample_values: data.map(row => ({
                        userid: row.userid,
                        username: row.username,
                        auth_id: row.auth_id
                    }))
                }
            };
        }
        
        return res.status(200).json({
            tableName,
            sampleData: data,
            columns: data && data[0] ? Object.keys(data[0]) : [],
            tableExists: Boolean(data),
            source: 'sample',
            ...extraInfo
        });
    } catch (error) {
        console.error(`Error in getTableInfo for table ${req.params.tableName}:`, error);
        return res.status(500).json({ 
            error: error.message || 'An error occurred while checking table structure',
            tableName: req.params.tableName
        });
    }
};