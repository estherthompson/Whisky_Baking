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