import supabase from '../config/supabaseClient.js';

export const signup = async (req, res) => {
    try {
        console.log('Signup request received:', req.body);
        const { email, password, name, username } = req.body;

        // Log the received data
        console.log('Received data:', {
            email,
            password: password ? '***' : 'missing',
            name,
            username
        });

        // Validate required fields
        if (!email || !password || !name || !username) {
            const missingFields = [];
            if (!email) missingFields.push('email');
            if (!password) missingFields.push('password');
            if (!name) missingFields.push('name');
            if (!username) missingFields.push('username');
            
            console.log('Missing required fields:', missingFields);
            return res.status(400).json({ 
                error: 'All fields are required',
                missingFields: missingFields
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            console.log('Invalid email format:', email);
            return res.status(400).json({ error: 'Invalid email format' });
        }

        // Validate password length
        if (password.length < 6) {
            console.log('Password too short');
            return res.status(400).json({ error: 'Password must be at least 6 characters long' });
        }

        // First, create the user in Supabase Auth
        console.log('Attempting to create user in Supabase Auth...');
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
        });

        if (authError) {
            console.error('Supabase Auth Error:', authError);
            return res.status(400).json({ 
                error: 'Authentication failed',
                details: authError.message
            });
        }

        console.log('Auth user created successfully:', authData);
        
        // Extract the auth_id from the auth response
        const auth_id = authData?.user?.id;
        console.log('Extracted auth_id:', auth_id);

        // Create the user in our users table
        console.log('Attempting to create user in database...');
        try {
            // Generate a unique integer ID for the user
            const { data: lastUser, error: lastUserError } = await supabase
                .from('user_account')
                .select('userid')
                .order('userid', { ascending: false })
                .limit(1)
                .single();

            if (lastUserError && lastUserError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
                console.error('Error fetching last user:', lastUserError);
                throw lastUserError;
            }

            const nextUserId = lastUser ? lastUser.userid + 1 : 1;

            console.log('Attempting to insert user with ID:', nextUserId);
            const { data: userData, error: userError } = await supabase
                .from('user_account')
                .insert([
                    {
                        userid: nextUserId,
                        name: name,
                        email: email,
                        password: password,
                        isadmin: false,
                        username: username,
                        auth_id: auth_id // Add the auth_id from Supabase Auth
                    }
                ])
                .select();

            if (userError) {
                console.error('Database Error Details:', {
                    message: userError.message,
                    details: userError.details,
                    hint: userError.hint,
                    code: userError.code
                });
                
                return res.status(400).json({ 
                    error: 'Failed to create user in database',
                    details: userError.message,
                    code: userError.code
                });
            }

            console.log('User created successfully in database:', userData);
            res.status(201).json(userData[0]);
        } catch (dbError) {
            console.error('Database Operation Error:', dbError);
            return res.status(500).json({ 
                error: 'Database operation failed',
                details: dbError.message
            });
        }
    } catch (error) {
        console.error('Unexpected Error:', error);
        res.status(500).json({ 
            error: 'An unexpected error occurred during signup',
            details: error.message
        });
    }
};

export const login = async (req, res) => {
    try {
        console.log('Login request received:', req.body);
        const { identifier, password } = req.body;

        if (!identifier || !password) {
            console.log('Missing login credentials');
            return res.status(400).json({ 
                error: 'Email/username and password are required',
                missing: !identifier ? 'identifier' : 'password'
            });
        }

        // Try to find user by either email or username
        console.log('Searching for user with identifier:', identifier);
        const { data: userData, error: userError } = await supabase
            .from('user_account')
            .select('*')
            .or(`email.eq.${identifier},username.eq.${identifier}`)
            .single();

        if (userError || !userData) {
            console.log('User not found or error:', userError);
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        // Authenticate user with Supabase Auth using the email
        console.log('Attempting to authenticate user:', userData.email);
        const { data, error } = await supabase.auth.signInWithPassword({
            email: userData.email,
            password,
        });

        if (error) {
            console.error('Auth Error:', error);
            return res.status(400).json({ 
                error: 'Authentication failed',
                details: error.message
            });
        }

        res.status(200).json(userData);
    } catch (error) {
        console.error('Server Error:', error);
        res.status(500).json({ 
            error: 'An unexpected error occurred during login',
            details: error.message
        });
    }
}; 