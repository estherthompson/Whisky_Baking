import supabase from '../config/supabaseClient.js';
import { v4 as uuidv4 } from 'uuid'; // You'll need to install this package

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
            
            // Generate a random UUID for auth_id
            const auth_id = uuidv4();
            console.log('Generated UUID for auth_id:', auth_id);

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
                        auth_id: auth_id // Add the generated UUID
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
            
            // Standardize the response format with consistent userid field
            const standardizedUser = {
                ...userData[0],
                // Make sure userid exists (in case the DB returns UserID or id)
                userid: userData[0].userid || userData[0].UserID || userData[0].userId || userData[0].id
            };
            
            console.log('Returning standardized user data:', standardizedUser);
            res.status(201).json(standardizedUser);
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

        // Simple password check directly with stored password
        if (userData.password !== password) {
            console.log('Password mismatch');
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        // Standardize the response format with consistent userid field
        const standardizedUser = {
            ...userData,
            // Make sure userid exists (in case the DB returns UserID or id)
            userid: userData.userid || userData.UserID || userData.userId || userData.id
        };
        
        console.log('Login successful for user:', standardizedUser.email);
        console.log('User data returned:', standardizedUser);
        res.status(200).json(standardizedUser);
    } catch (error) {
        console.error('Server Error:', error);
        res.status(500).json({ 
            error: 'An unexpected error occurred during login',
            details: error.message
        });
    }
};

export const deleteAccount = async (req, res) => {
    try {
        const { userId } = req.params;
        
        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        console.log('Delete account request received for user ID:', userId);

        // 1. Delete the user's profile
        const { error: profileError } = await supabase
            .from('profile')
            .delete()
            .eq('userid', userId);

        if (profileError) {
            console.error('Error deleting user profile:', profileError);
            // We continue even if there's an error with the profile deletion
        }

        // 2. Delete the user's saved recipes
        const { error: savedRecipesError } = await supabase
            .from('saved_recipes')
            .delete()
            .eq('userid', userId);
            
        if (savedRecipesError) {
            console.error('Error deleting user saved recipes:', savedRecipesError);
            // We continue even if there's an error with the saved recipes deletion
        }
        
        // 3. Delete the user's recipes
        const { error: recipesError } = await supabase
            .from('recipe')
            .delete()
            .eq('userid', userId);
            
        if (recipesError) {
            console.error('Error deleting user recipes:', recipesError);
            // We continue even if there's an error with the recipes deletion
        }

        // 4. Finally, delete the user account
        const { error: userError } = await supabase
            .from('user_account')
            .delete()
            .eq('userid', userId);

        if (userError) {
            console.error('Error deleting user account:', userError);
            return res.status(500).json({ 
                error: 'Failed to delete user account',
                details: userError.message
            });
        }

        console.log('User account and related data deleted successfully');
        return res.status(200).json({ message: 'Account deleted successfully' });
    } catch (error) {
        console.error('Server Error in deleteAccount:', error);
        res.status(500).json({ 
            error: 'An unexpected error occurred during account deletion',
            details: error.message
        });
    }
};

export const changePassword = async (req, res) => {
    try {
        const { userId } = req.params;
        const { currentPassword, newPassword } = req.body;
        
        console.log('Change password request received:');
        console.log('- User ID:', userId);
        console.log('- Request body:', req.body);
        console.log('- Current password provided:', !!currentPassword);
        console.log('- New password provided:', !!newPassword);
        
        if (!userId) {
            console.log('Error: User ID is required');
            return res.status(400).json({ error: 'User ID is required' });
        }

        if (!currentPassword || !newPassword) {
            console.log('Error: Missing password data in request');
            return res.status(400).json({ 
                error: 'Current password and new password are required'
            });
        }

        // Validate new password length
        if (newPassword.length < 6) {
            console.log('Error: New password is too short');
            return res.status(400).json({ error: 'Password must be at least 6 characters long' });
        }

        console.log('Change password request validation passed for user ID:', userId);

        // Fetch the user to verify current password
        console.log('Fetching user from database...');
        const { data: userData, error: userError } = await supabase
            .from('user_account')
            .select('*')
            .eq('userid', userId)
            .single();

        if (userError) {
            console.error('Error fetching user from DB:', userError);
            return res.status(404).json({ error: 'User not found', details: userError.message });
        }

        if (!userData) {
            console.log('User not found in database');
            return res.status(404).json({ error: 'User not found' });
        }

        console.log('User found in database:', {
            userid: userData.userid,
            email: userData.email,
            passwordMatch: userData.password === currentPassword
        });

        // Verify current password
        if (userData.password !== currentPassword) {
            console.log('Current password mismatch');
            return res.status(400).json({ error: 'Current password is incorrect' });
        }

        // Update the password
        console.log('Updating password in database...');
        const { error: updateError } = await supabase
            .from('user_account')
            .update({ 
                password: newPassword
            })
            .eq('userid', userId);

        if (updateError) {
            console.error('Error updating password in DB:', updateError);
            return res.status(500).json({ 
                error: 'Failed to update password',
                details: updateError.message
            });
        }

        console.log('Password updated successfully for user ID:', userId);
        return res.status(200).json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error('Server Error in changePassword:', error);
        res.status(500).json({ 
            error: 'An unexpected error occurred during password change',
            details: error.message
        });
    }
};

export const debugUserAccount = async (req, res) => {
    try {
        console.log('Debug user_account table request received');
        
        // Test database connection
        console.log('Testing database connection...');
        
        // Try to fetch a user
        const { data: userSample, error: sampleError } = await supabase
            .from('user_account')
            .select('userid, email, username, password')
            .limit(1);
        
        if (sampleError) {
            console.error('Error connecting to user_account table:', sampleError);
            return res.status(500).json({
                error: 'Database connection error',
                details: sampleError.message
            });
        }
        
        console.log('Sample user data (first user in table):', userSample);
        
        // Try to get table structure
        const { data: tableInfo, error: tableError } = await supabase
            .rpc('get_table_info', { table_name: 'user_account' });
        
        const tableStructure = tableInfo || 'Table info not available';
        
        if (tableError) {
            console.log('Could not get table structure:', tableError);
        }
        
        // Return debug info
        return res.status(200).json({
            message: 'Database connection test successful',
            sampleUser: userSample?.[0] ? {
                userid: userSample[0].userid,
                email: userSample[0].email,
                username: userSample[0].username,
                hasPassword: !!userSample[0].password
            } : 'No users found',
            tableStructure
        });
    } catch (error) {
        console.error('Error in debugUserAccount:', error);
        return res.status(500).json({
            error: 'An unexpected error occurred during debug',
            details: error.message
        });
    }
};

export const testPasswordUpdate = async (req, res) => {
    try {
        const { userId, newPassword } = req.body;
        
        if (!userId || !newPassword) {
            return res.status(400).json({ error: 'User ID and new password are required' });
        }
        
        console.log('Test password update request received:');
        console.log('- User ID:', userId);
        console.log('- New password length:', newPassword.length);
        
        // Check if user exists
        const { data: userData, error: userError } = await supabase
            .from('user_account')
            .select('userid, username, email, password')
            .eq('userid', userId)
            .single();
            
        if (userError) {
            console.error('Error finding user:', userError);
            return res.status(404).json({ 
                error: 'User not found', 
                details: userError.message 
            });
        }
        
        console.log('User found:', {
            userid: userData.userid,
            username: userData.username,
            email: userData.email,
            currentPassword: userData.password
        });
        
        // Directly update password
        console.log('Attempting direct password update...');
        const { data: updateData, error: updateError } = await supabase
            .from('user_account')
            .update({ 
                password: newPassword
            })
            .eq('userid', userId)
            .select();
            
        if (updateError) {
            console.error('Error updating password:', updateError);
            return res.status(500).json({ 
                error: 'Failed to update password', 
                details: updateError.message 
            });
        }
        
        console.log('Password updated successfully, result:', updateData);
        
        // Re-fetch user to confirm update
        const { data: updatedUser, error: refetchError } = await supabase
            .from('user_account')
            .select('userid, password')
            .eq('userid', userId)
            .single();
            
        if (refetchError) {
            console.log('Error re-fetching user:', refetchError);
        } else {
            console.log('Confirmed update:', {
                userid: updatedUser.userid,
                passwordUpdated: updatedUser.password === newPassword
            });
        }
        
        return res.status(200).json({ 
            message: 'Password test update successful',
            updated: true
        });
    } catch (error) {
        console.error('Server Error in testPasswordUpdate:', error);
        return res.status(500).json({ 
            error: 'An unexpected error occurred during test password update',
            details: error.message
        });
    }
};