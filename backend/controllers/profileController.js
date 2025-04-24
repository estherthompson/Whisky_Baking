import supabase from '../config/supabaseClient.js';

export const getProfileByUserId = async (req, res) => {
    try {
        const { userId } = req.params;
        
        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        const { data, error } = await supabase
            .from('profile')
            .select('*')
            .eq('userid', userId)
            .single();

        if (error) {
            console.error('Error fetching profile:', error);
            return res.status(500).json({ error: 'Failed to fetch profile' });
        }

        if (!data) {
            return res.status(404).json({ error: 'Profile not found' });
        }

        res.json(data);
    } catch (error) {
        console.error('Error in getProfileByUserId:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const createProfile = async (req, res) => {
    try {
        const { userId, username, bio, pronouns, imageUrl } = req.body;
        
        if (!userId || !username) {
            return res.status(400).json({ error: 'User ID and username are required' });
        }

        const { data: existingProfile } = await supabase
            .from('profile')
            .select('profileid')
            .eq('userid', userId)
            .single();

        if (existingProfile) {
            return res.status(400).json({ error: 'Profile already exists for this user' });
        }

        const { data, error } = await supabase
            .from('profile')
            .insert([{
                userid: userId,
                username: username,
                bio: bio || null,
                pronouns: pronouns || null,
                imageurl: imageUrl || null,
            }])
            .select()
            .single();

        if (error) {
            console.error('Error creating profile:', error);
            return res.status(500).json({ error: 'Failed to create profile' });
        }

        res.status(201).json(data);
    } catch (error) {
        console.error('Error in createProfile:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const updateProfile = async (req, res) => {
    try {
        const { userId } = req.params;
        const { bio, pronouns, imageUrl } = req.body;
        
        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        const { data: existingProfile } = await supabase
            .from('profile')
            .select('profileid')
            .eq('userid', userId)
            .single();

        if (!existingProfile) {
            return res.status(404).json({ error: 'Profile not found' });
        }

        const { data, error } = await supabase
            .from('profile')
            .update({
                bio: bio,
                pronouns: pronouns,
                imageurl: imageUrl,
                updatedat: new Date()
            })
            .eq('userid', userId)
            .select()
            .single();

        if (error) {
            console.error('Error updating profile:', error);
            return res.status(500).json({ error: 'Failed to update profile' });
        }

        res.json(data);
    } catch (error) {
        console.error('Error in updateProfile:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const uploadProfileImage = async (req, res) => {
    try {
        const { userId } = req.params;
        const { file } = req.body;
        
        if (!userId || !file) {
            return res.status(400).json({ error: 'User ID and file are required' });
        }

        const { data: user, error: userError } = await supabase
            .from('user_account')
            .select('userid')
            .eq('userid', userId)
            .single();

        if (userError || !user) {
            console.error('Error fetching user:', userError);
            return res.status(404).json({ error: 'User not found' });
        }

        const fileData = Buffer.from(file.split(',')[1], 'base64');
        const filePath = `${userId}/profile.${file.split(';')[0].split('/')[1]}`;

        const { data, error } = await supabase
            .storage
            .from('profile-photos')
            .upload(filePath, fileData, {
                contentType: file.split(';')[0].split(':')[1],
                upsert: true
            });

        if (error) {
            console.error('Error uploading image:', error);
            return res.status(500).json({ error: 'Failed to upload image' });
        }

        const publicUrlData = supabase
            .storage
            .from('profile-photos')
            .getPublicUrl(filePath);
        
        const publicURL = publicUrlData.data?.publicUrl || publicUrlData.publicURL;
        
        console.log('Generated public URL:', publicURL);

        if (!publicURL) {
            console.error('Failed to generate public URL');
            return res.status(500).json({ error: 'Failed to generate public URL for image' });
        }

        const { error: updateError } = await supabase
            .from('profile')
            .update({ imageurl: publicURL })
            .eq('userid', userId);

        if (updateError) {
            console.error('Error updating profile with image URL:', updateError);
            return res.status(500).json({ error: 'Failed to update profile with image URL' });
        }

        res.json({ imageUrl: publicURL });
    } catch (error) {
        console.error('Error in uploadProfileImage:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}; 