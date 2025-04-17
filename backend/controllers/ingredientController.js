import supabase from '../config/supabaseClient.js';

export const getIngredients = async (req, res) => {
    try {
        console.log('Fetching ingredients...');
        const { data: ingredients, error } = await supabase
            .from('ingredient')
            .select('ingredientid, name, category, isallergen, nutritioninfo')
            .order('name');

        if (error) {
            console.error('Error fetching ingredients:', error);
            return res.status(500).json({ 
                error: 'Failed to fetch ingredients',
                details: error.message 
            });
        }

        res.status(200).json(ingredients);
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ 
            error: 'An unexpected error occurred',
            details: error.message 
        });
    }
};

export const getIngredientById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const { data: ingredient, error } = await supabase
            .from('ingredient')
            .select('ingredientid, name, category, isallergen, nutritioninfo')
            .eq('ingredientid', id)
            .single();

        if (error) {
            console.error('Error fetching ingredient by ID:', error);
            return res.status(404).json({ 
                error: 'Ingredient not found',
                details: error.message 
            });
        }

        res.status(200).json(ingredient);
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ 
            error: 'An unexpected error occurred',
            details: error.message 
        });
    }
};

export const createIngredient = async (req, res) => {
    try {
        const { name, category, isAllergen, nutritionInfo } = req.body;

        if (!name) {
            return res.status(400).json({
                error: 'Ingredient name is required'
            });
        }

        // Get max ingredient ID to generate new ID
        const { data: lastIng, error: lastIngError } = await supabase
            .from('ingredient')
            .select('ingredientid')
            .order('ingredientid', { ascending: false })
            .limit(1)
            .single();

        if (lastIngError && lastIngError.code !== 'PGRST116') {
            console.error('Error fetching last ingredient ID:', lastIngError);
            return res.status(500).json({ 
                error: 'Failed to generate ingredient ID',
                details: lastIngError.message 
            });
        }

        const nextIngId = lastIng ? lastIng.ingredientid + 1 : 1;

        // Create the new ingredient
        const { data: newIngredient, error } = await supabase
            .from('ingredient')
            .insert([
                {
                    ingredientid: nextIngId,
                    name,
                    category: category || 'Other',
                    isallergen: isAllergen || false,
                    nutritioninfo: nutritionInfo || null
                }
            ])
            .select()
            .single();

        if (error) {
            console.error('Error creating ingredient:', error);
            return res.status(400).json({ 
                error: 'Failed to create ingredient',
                details: error.message 
            });
        }

        res.status(201).json({
            ...newIngredient,
            message: 'Ingredient created successfully'
        });
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ 
            error: 'An unexpected error occurred',
            details: error.message 
        });
    }
};

// Get ingredients used in a recipe
export const getRecipeIngredients = async (req, res) => {
    try {
        const { recipeId } = req.params;
        
        // Join recipe_ingredient with ingredient to get full ingredient details
        const { data: ingredients, error } = await supabase
            .from('recipe_ingredient')
            .select(`
                recipeid,
                ingredientid,
                quantity,
                ingredient:ingredientid (
                    ingredientid,
                    name,
                    category,
                    isallergen,
                    nutritioninfo
                )
            `)
            .eq('recipeid', recipeId);

        if (error) {
            console.error('Error fetching recipe ingredients:', error);
            return res.status(500).json({ 
                error: 'Failed to fetch recipe ingredients',
                details: error.message 
            });
        }

        // Format response to be more user-friendly
        const formattedIngredients = ingredients.map(item => ({
            ...item.ingredient,
            quantity: item.quantity
        }));

        res.status(200).json(formattedIngredients);
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ 
            error: 'An unexpected error occurred',
            details: error.message 
        });
    }
}; 