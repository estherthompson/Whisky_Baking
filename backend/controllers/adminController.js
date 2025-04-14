import supabase from '../config/supabaseClient.js';

export const getTotalUsers = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('user_account')
            .select('*');

        if (error) {
            console.error('Error fetching total users:', error);
            return res.status(500).json({ error: 'Failed to fetch total users' });
        }

        res.json({ totalUsers: data.length });
    } catch (error) {
        console.error('Error in getTotalUsers:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}; 