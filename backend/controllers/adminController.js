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