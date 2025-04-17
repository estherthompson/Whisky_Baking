import supabase from '../config/supabaseClient.js';

export const getIngredients = async (req, res) => {
    try {
        const { data: ingredients, error } = await supabase
            .from('ingredient')
            .select('*')
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

export const createRecipe = async (req, res) => {
    try {
        const { name, description, instructions, recipeTime, ingredients, userId } = req.body;

        // First, insert the recipe
        const { data: recipeData, error: recipeError } = await supabase
            .from('recipe')
            .insert([
                { 
                    name,
                    description,
                    instructions,
                    recipetime: recipeTime
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

        // Then, insert the recipe ingredients
        const recipeIngredients = ingredients.map(ing => ({
            recipeid: recipeData.recipeid,
            ingredientid: ing.ingredientId,
            quantity: ing.quantity
        }));

        const { error: ingredientsError } = await supabase
            .from('recipe_ingredient')
            .insert(recipeIngredients);

        if (ingredientsError) {
            console.error('Error adding recipe ingredients:', ingredientsError);
            // If ingredients fail to add, delete the recipe
            await supabase
                .from('recipe')
                .delete()
                .eq('recipeid', recipeData.recipeid);

            return res.status(400).json({ 
                error: 'Failed to add recipe ingredients',
                details: ingredientsError.message 
            });
        }

        res.status(201).json(recipeData);
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ 
            error: 'An unexpected error occurred',
            details: error.message 
        });
    }
}; 