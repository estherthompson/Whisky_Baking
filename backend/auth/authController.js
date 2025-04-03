import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import supabase from "../config/supabaseClient.js";
import dotenv from "dotenv";

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET;

// Register a new user
const register = async (req, res) => {
    const { email, password, name } = req.body;
    console.log('Registration attempt for:', { email, name }); // Don't log password

    try {
        // Check if user already exists
        console.log('Checking for existing user...');
        const { data: existingUser, error: checkError } = await supabase
            .from('User_Account')
            .select('Email')
            .eq('Email', email)
            .single();

        console.log('Check error details:', checkError); // Log the full error object

        // If we get data back, user exists
        if (existingUser) {
            console.log('User already exists:', email);
            return res.status(400).json({ message: "User already exists" });
        }

        // If we get an error that's not "no rows returned", something went wrong
        if (checkError) {
            console.log('Error checking existing user:', {
                code: checkError.code,
                message: checkError.message,
                details: checkError.details,
                hint: checkError.hint
            });
            return res.status(500).json({ 
                message: "Error checking user existence", 
                error: checkError.message,
                details: checkError.details,
                hint: checkError.hint
            });
        }

        // Hash password
        console.log('Hashing password...');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user
        console.log('Creating new user...');
        const { data: newUser, error: insertError } = await supabase
            .from('User_Account')
            .insert([
                {
                    Name: name,
                    Email: email,
                    PasswordHash: hashedPassword,
                    IsAdmin: false
                }
            ])
            .select()
            .single();

        if (insertError) {
            console.log('Error creating user:', insertError);
            return res.status(500).json({ message: "Error creating user", error: insertError.message });
        }

        console.log('User created successfully:', newUser);

        // Generate JWT token
        const token = jwt.sign(
            { id: newUser.UserID, email: newUser.Email, isAdmin: newUser.IsAdmin },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            message: "User registered successfully",
            token,
            user: {
                id: newUser.UserID,
                name: newUser.Name,
                email: newUser.Email,
                isAdmin: newUser.IsAdmin
            }
        });

    } catch (error) {
        console.log('Server error:', error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
}

// Login user
const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        // Check if user exists
        const { data: user, error } = await supabase
            .from('User_Account')
            .select('*')
            .eq('Email', email)
            .single();

        if (error || !user) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.PasswordHash);
        if (!isValidPassword) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: user.UserID, email: user.Email, isAdmin: user.IsAdmin },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(200).json({
            message: "Login successful",
            token,
            user: {
                id: user.UserID,
                name: user.Name,
                email: user.Email,
                isAdmin: user.IsAdmin
            }
        });

    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
}

export { register, login };
