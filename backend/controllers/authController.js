import supabase from '../config/supabaseClient.js';
import { v4 as uuidv4 } from 'uuid'; 

export const signup = async (req, res) => {
    try {
        console.log('Signup request received:', req.body);
        const { email, password, name, username } = req.body;

        console.log('Received data:', {
            email,
            password: password ? '***' : 'missing',
            name,
            username
        });

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

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            console.log('Invalid email format:', email);
            return res.status(400).json({ error: 'Invalid email format' });
        }

        if (password.length < 6) {
            console.log('Password too short');
            return res.status(400).json({ error: 'Password must be at least 6 characters long' });
        }

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

        console.log('Attempting to create user in database...');
        try {
            const { data: lastUser, error: lastUserError } = await supabase
                .from('user_account')
                .select('userid')
                .order('userid', { ascending: false })
                .limit(1)
                .single();

            if (lastUserError && lastUserError.code !== 'PGRST116') { 
                console.error('Error fetching last user:', lastUserError);
                throw lastUserError;
            }

            const nextUserId = lastUser ? lastUser.userid + 1 : 1;
            
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
                        auth_id: auth_id 
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
            
            const standardizedUser = {
                ...userData[0],
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

        if (userData.password !== password) {
            console.log('Password mismatch');
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        const standardizedUser = {
            ...userData,
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

        const { error: profileError } = await supabase
            .from('profile')
            .delete()
            .eq('userid', userId);

        if (profileError) {
            console.error('Error deleting user profile:', profileError);
        }

        const { error: savedRecipesError } = await supabase
            .from('saved_recipes')
            .delete()
            .eq('userid', userId);
            
        if (savedRecipesError) {
            console.error('Error deleting user saved recipes:', savedRecipesError);
        }
        
        const { error: recipesError } = await supabase
            .from('recipe')
            .delete()
            .eq('userid', userId);
            
        if (recipesError) {
            console.error('Error deleting user recipes:', recipesError);
        }

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

        if (newPassword.length < 6) {
            console.log('Error: New password is too short');
            return res.status(400).json({ error: 'Password must be at least 6 characters long' });
        }

        console.log('Change password request validation passed for user ID:', userId);

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

        if (userData.password !== currentPassword) {
            console.log('Current password mismatch');
            return res.status(400).json({ error: 'Current password is incorrect' });
        }

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

