import supabase from '../config/supabaseClient.js';

const uploadProfilePhoto = async (req, res) => {
  try {
    console.log('Upload request received');
    
    // Get the current session from Supabase
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Session error:', sessionError);
      return res.status(401).json({ error: 'Session error: ' + sessionError.message });
    }
    
    if (!session) {
      console.error('No session found');
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Get the user's email from the session
    const userEmail = session.user.email;
    
    // Find the user in our user_account table by email
    const { data: userData, error: userError } = await supabase
      .from('user_account')
      .select('userid')
      .eq('email', userEmail)
      .single();

    if (userError || !userData) {
      console.error('Error finding user:', userError);
      return res.status(401).json({ error: 'User not found' });
    }

    const userid = userData.userid;
    console.log('User ID:', userid);

    const file = req.file;
    if (!file) {
      console.error('No file in request');
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('File details:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    });

    // Create a unique filename to prevent collisions
    const fileExtension = file.originalname.split('.').pop();
    const uniqueFilename = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExtension}`;
    const filePath = `${userid}/${uniqueFilename}`;

    console.log('Attempting to upload to path:', filePath);

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('profile-photos')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: true
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return res.status(500).json({ 
        error: 'Storage upload error: ' + uploadError.message,
        details: uploadError
      });
    }

    console.log('File uploaded successfully:', uploadData);

    // Get the public URL of the uploaded file
    const { data: { publicUrl } } = supabase.storage
      .from('profile-photos')
      .getPublicUrl(filePath);

    console.log('Public URL:', publicUrl);

    // Update or create profile with photo URL
    const { error: updateError } = await supabase
      .from('profiles')
      .upsert({
        userid: userid,
        profile_photo_url: publicUrl,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'userid'
      });

    if (updateError) {
      console.error('Database update error:', updateError);
      return res.status(500).json({ error: 'Database update error: ' + updateError.message });
    }

    console.log('Profile updated successfully');
    res.json({ 
      message: 'Profile photo uploaded successfully',
      photoUrl: publicUrl 
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    res.status(500).json({ error: 'Failed to upload profile photo: ' + error.message });
  }
};

  const updateProfile = async (req, res) => {
  try {
    // Get the current session from Supabase
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Get the user's email from the session
    const userEmail = session.user.email;
    
    // Find the user in our user_account table by email
    const { data: userData, error: userError } = await supabase
      .from('user_account')
      .select('userid')
      .eq('email', userEmail)
      .single();

    if (userError || !userData) {
      return res.status(401).json({ error: 'User not found' });
    }

    const userid = userData.userid;

    // Update the profile
    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        userid: userid,
        bio: req.body.bio || '',
        website: req.body.website || '',
        pronouns: req.body.pronouns || '',
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'userid'
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.json(data);
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

const getProfile = async (req, res) => {
  try {
    // Get the current session from Supabase
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Get the user's email from the session
    const userEmail = session.user.email;
    
    // Find the user in our user_account table by email
    const { data: userData, error: userError } = await supabase
      .from('user_account')
      .select('userid')
      .eq('email', userEmail)
      .single();

    if (userError || !userData) {
      return res.status(401).json({ error: 'User not found' });
    }

    const userid = userData.userid;

    // Get or create profile
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('userid', userid)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      throw error;
    }

    // If no profile exists, create one with default values
    if (!data) {
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert([{
          userid: userid,
          profile_photo_url: '',
          bio: '',
          website: '',
          pronouns: '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (createError) {
        throw createError;
      }

      return res.json(newProfile);
    }

    res.json(data);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

export const getProfileById = async (req, res) => {
  try {
    const { userid } = req.params;
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('userid', userid)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      throw error;
    }

    if (!data) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    res.json(data);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Error fetching profile' });
  }
};

export { uploadProfilePhoto, getProfile, updateProfile }; 