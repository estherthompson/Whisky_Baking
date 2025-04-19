import supabase from '../config/supabaseClient.js';

// Get all ratings for a recipe
export const getRatings = async (req, res) => {
    try {
        const { recipeid } = req.params;
        
        const { data: ratings, error } = await supabase
            .from('rating')
            .select(`
                ratingid,
                recipeid,
                userid,
                score,
                dateposted,
                reviewtext,
                user_account (
                    name
                )
            `)
            .eq('recipeid', recipeid)
            .order('dateposted', { ascending: false });

        if (error) {
            console.error('Error fetching ratings:', error);
            return res.status(400).json({
                error: 'Failed to fetch ratings',
                details: error.message
            });
        }

        res.json({
            ratings,
            count: ratings.length
        });

    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({
            error: 'An unexpected error occurred',
            details: error.message
        });
    }
};

// Create a new rating
export const createRating = async (req, res) => {
    try {
        const {
            recipeid,
            userid,
            score,
            reviewtext
        } = req.body;

        // Validate required fields
        if (!recipeid || !userid || !score || !reviewtext) {
            const missingFields = [];
            if (!recipeid) missingFields.push('recipeid');
            if (!userid) missingFields.push('userid');
            if (!score) missingFields.push('score');
            if (!reviewtext) missingFields.push('reviewtext');

            return res.status(400).json({
                error: 'All fields are required',
                missingFields
            });
        }

        // Validate score is between 1 and 5
        if (score < 1 || score > 5) {
            return res.status(400).json({
                error: 'Score must be between 1 and 5'
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

        // Insert the new rating
        const { data: rating, error } = await supabase
            .from('rating')
            .insert([
                {
                    ratingid: nextRatingId,
                    recipeid,
                    userid,
                    score,
                    dateposted: new Date().toISOString().split('T')[0], // Format as YYYY-MM-DD
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
            message: 'Rating created successfully',
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