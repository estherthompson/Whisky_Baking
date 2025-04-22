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
        // Try with is_approved first (with underscore)
        let { data, error } = await supabase
            .from('recipe')
            .select('*')
            .eq('is_approved', false);
            
        // If first attempt fails or returns no data, try with isapproved (no underscore)
        if ((error || !data || data.length === 0)) {
            console.log('Trying with isapproved instead of is_approved');
            const result = await supabase
                .from('recipe')
                .select('*')
                .eq('isapproved', false);
                
            data = result.data;
            error = result.error;
        }
        
        if (error) {
            console.error('Error fetching pending recipes:', error);
            return res.status(500).json({ error: 'Failed to fetch pending recipes' });
        }
        
        console.log('Pending recipes:', data);
        
        res.json({ recipes: data || [] });
    } catch (error) {
        console.error('Error in getPendingRecipes:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const approveRecipe = async (req, res) => {
    const { recipeId } = req.params;
    
    try {
        // Try with is_approved first (with underscore)
        let { data, error } = await supabase
            .from('recipe')
            .update({ is_approved: true })
            .eq('recipeid', recipeId)
            .select();
            
        // If first attempt fails, try with isapproved (no underscore)
        if (error) {
            console.log('Trying with isapproved instead of is_approved');
            const result = await supabase
                .from('recipe')
                .update({ isapproved: true })
                .eq('recipeid', recipeId)
                .select();
                
            data = result.data;
            error = result.error;
        }
            
        if (error) {
            console.error('Error approving recipe:', error);
            return res.status(500).json({ error: 'Failed to approve recipe' });
        }
        
        res.json({ success: true, message: 'Recipe approved successfully' });
    } catch (error) {
        console.error('Error in approveRecipe:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const checkRecipeTable = async (req, res) => {
    try {
        // First check if the recipe table exists and has content
        const { data, error } = await supabase
            .from('recipe')
            .select('*')
            .limit(1);
            
        if (error) {
            console.error('Error checking recipe table:', error);
            return res.status(500).json({ 
                success: false, 
                error: 'Failed to check recipe table' 
            });
        }
        
        if (!data || data.length === 0) {
            return res.json({
                success: true,
                hasRecords: false,
                message: 'Recipe table exists but has no records'
            });
        }
        
        // Get column information
        const sampleRecord = data[0];
        const columns = Object.keys(sampleRecord);
        
        // Check specifically for approval-related columns
        const approvalColumns = columns.filter(col => 
            col.toLowerCase().includes('approv') || 
            col.toLowerCase().includes('approved')
        );
        
        res.json({
            success: true,
            hasRecords: true,
            columns: columns,
            approvalColumns: approvalColumns,
            sampleRecord: sampleRecord
        });
    } catch (error) {
        console.error('Error in checkRecipeTable:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Internal server error' 
        });
    }
};