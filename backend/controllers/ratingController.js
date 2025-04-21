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
        // Extract data from request body with frontend format
        const {
            userId,
            recipeId,
            score,
            reviewText,
            datePosted
        } = req.body;

        console.log('Received review data:', req.body);

        // Map to database field names
        const recipeid = recipeId;
        const userid = userId;
        const reviewtext = reviewText;

        // Validate required fields
        if (!recipeid || !userid || !score) {
            const missingFields = [];
            if (!recipeid) missingFields.push('recipeId');
            if (!userid) missingFields.push('userId');
            if (!score) missingFields.push('score');

            return res.status(400).json({
                error: 'Required fields are missing',
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

        if (checkError && checkError.code !== 'PGRST116') {
            // Error other than "no rows returned"
            console.error('Error checking existing rating:', checkError);
            return res.status(500).json({
                error: 'Failed to check existing rating',
                details: checkError.message
            });
        }

        if (existingRating) {
            return res.status(400).json({
                error: 'You have already reviewed this recipe'
            });
        }

        // Get the last rating ID
        const { data: lastRating, error: countError } = await supabase
            .from('rating')
            .select('ratingid')
            .order('ratingid', { ascending: false })
            .limit(1)
            .single();

        if (countError && countError.code !== 'PGRST116') {
            console.error('Error getting last rating ID:', countError);
        }

        const nextRatingId = lastRating ? lastRating.ratingid + 1 : 1;

        // Format date for PostgreSQL
        const formattedDate = datePosted ? 
            new Date(datePosted).toISOString().split('T')[0] : 
            new Date().toISOString().split('T')[0];

        // Insert the new rating
        const { data: rating, error } = await supabase
            .from('rating')
            .insert([
                {
                    ratingid: nextRatingId,
                    recipeid,
                    userid,
                    score,
                    dateposted: formattedDate,
                    reviewtext: reviewtext || ''
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

        // Update recipe average rating
        await updateRecipeAverageRating(recipeid);

        res.status(201).json({
            message: 'Review submitted successfully',
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

// Helper function to update a recipe's average rating
async function updateRecipeAverageRating(recipeid) {
    try {
        // Get all ratings for the recipe
        const { data: ratings, error: ratingsError } = await supabase
            .from('rating')
            .select('score')
            .eq('recipeid', recipeid);

        if (ratingsError) {
            console.error('Error fetching ratings for average calculation:', ratingsError);
            return;
        }

        if (!ratings || ratings.length === 0) {
            return; // No ratings to calculate average
        }

        // Calculate average
        const sum = ratings.reduce((total, rating) => total + rating.score, 0);
        const average = sum / ratings.length;

        // Update recipe with new average rating
        const { error: updateError } = await supabase
            .from('recipe')
            .update({ average_rating: average.toFixed(1) })
            .eq('recipeid', recipeid);

        if (updateError) {
            console.error('Error updating recipe average rating:', updateError);
        }
    } catch (error) {
        console.error('Error in updateRecipeAverageRating:', error);
    }
} 