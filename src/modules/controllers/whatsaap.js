const axios = require('axios');
const jwt = require('jsonwebtoken'); // Import jwt
const User = require('../models/AnuUser'); // Correct path to the User model
require('dotenv').config(); // Load environment variables

// Use environment variables
const API_URL = process.env.API_URL;
const API_KEY = process.env.API_KEY;
const SENDER_NUMBER = process.env.SENDER_NUMBER;
const DEFAULT_MESSAGE = process.env.DEFAULT_MESSAGE;
const JWT_SECRET = process.env.JWT_SECRET; // Make sure to have a secret key in .env

// Store OTPs temporarily
const otpStore = {}; // In-memory storage for OTPs

// Helper function to generate a 4-digit OTP
const generateOTP = () => {
    return Math.floor(1000 + Math.random() * 9000).toString(); // Generate a random 4-digit number
};

// Define the expiration time (1 hour)
const OTP_EXPIRATION_TIME = 60 * 60 * 1000; // 1 hour in milliseconds

exports.loginUser = async (req, res) => {
    const { number, name, role } = req.body;

    try {
        // Check if the user exists
        let user = await User.findOne({ number });

        // Generate the OTP
        const otp = generateOTP();
        const expirationTime = Date.now() + OTP_EXPIRATION_TIME;

        // Store the OTP with expiration time
        otpStore[number] = { otp, expirationTime };
        console.log(`Stored OTP for ${number}: ${otpStore[number].otp}, expires at: ${new Date(otpStore[number].expirationTime).toISOString()}`);

        // Append the OTP to the predefined message
        const fullMessage = `${DEFAULT_MESSAGE} Your OTP is: ${otp}`;
        const requestPayload = {
            api_key: API_KEY,
            sender: SENDER_NUMBER,
            number,
            message: fullMessage,
        };

        // Send OTP via WhatsApp API
        const response = await axios.post(API_URL, requestPayload, {
            httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false }),
        });

        // Check if the response indicates a successful message send
        if (response.status !== 200 || !response.data || !response.data.status) {
            console.error(`Failed to send OTP: ${response.status}`, response.data);
            return res.status(response.status).json({
                success: false,
                error: 'Failed to send message',
                details: response.data
            });
        }

        console.log(`Message sent successfully to ${number}`);

        // If user exists, return existing user data
        if (user) {
            // Check if the role matches
            if (user.role !== role) {
                return res.status(400).json({
                    message: "This phone number is already registered as a " + user.role + ". Please use the correct role."
                });
            }

            // Generate JWT token
            const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });

            return res.status(200).json({
                message: "OTP sent successfully! Please verify to log in.",
                user: {
                    id: user._id,
                    number: user.number,
                    name: user.name,
                    role: user.role,
                    address: user.address,
                    token, // Return the token in the response
                },
            });
        } else {
            // If user doesn't exist, create a new one
            user = new User({ number, name, role });
            await user.save();

            // Generate JWT token for the new user
            const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });

            return res.status(201).json({
                message: "User registered and OTP sent successfully! Please verify to log in.",
                user: {
                    id: user._id,
                    number: user.number,
                    name: user.name,
                    role: user.role,
                    address: user.address,
                    token, // Return the token in the response
                },
            });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
};


exports.sendMessage = async (req, res) => {
    const { number } = req.body;

    if (!number) {
        return res.status(400).json({ error: 'Recipient number is required' });
    }

    try {
        // Check if the number exists in the User model
        const user = await User.findOne({ number: number });

        if (!user) {
            return res.status(404).json({ message: 'Phone number not registered' });
        }

        // Generate the OTP
        const otp = generateOTP();
        console.log(`Generated OTP for ${number}: ${otp}`);

        // Calculate the expiration time
        const expirationTime = Date.now() + OTP_EXPIRATION_TIME;

        // Store the OTP with expiration time
        otpStore[number] = { otp, expirationTime };
        console.log(`Stored OTP for ${number}: ${otpStore[number].otp}, expires at: ${new Date(otpStore[number].expirationTime).toISOString()}`);

        // Append the OTP to the predefined message
        const fullMessage = `${DEFAULT_MESSAGE} Your OTP is: ${otp}`;

        const requestPayload = {
            api_key: API_KEY,
            sender: SENDER_NUMBER,
            number,
            message: fullMessage, // Use the full message with the OTP
        };

        // Send OTP via WhatsApp API
        const response = await axios.post(API_URL, requestPayload, {
            httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false }),
        });

        // Check if the response indicates a successful message send
        if (response.status === 200 && response.data && response.data.status === true) {
            console.log(`Message sent successfully to ${number}`);
            return res.status(200).json({
                success: true,
                message: 'OTP sent successfully',
                data: response.data, // You can remove this in production
                otp: otp // For testing purposes, you can return the OTP in development
            });
        } else {
            console.error(`Failed to send OTP: ${response.status}`, response.data);
            return res.status(response.status).json({
                success: false,
                error: 'Failed to send message',
                details: response.data
            });
        }

    } catch (error) {
        console.error('Error checking phone number or sending OTP:', error);
        return res.status(500).json({ success: false, error: 'Internal server error', details: error.message });
    }
};

// Function to verify OTP


exports.verifyOTP = async (req, res) => {
    const { otp } = req.body; // Only get OTP from request

    if (!otp) {
        return res.status(400).json({ message: 'OTP is required' });
    }

    try {
        // Retrieve the number from the stored OTP details
        const userEntry = Object.entries(otpStore).find(([key, value]) => value.otp === otp);
        
        if (!userEntry) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        const number = userEntry[0]; // Get the phone number from the entry

        // OTP verification successful, clear the OTP from the in-memory store
        delete otpStore[number];
        console.log(`OTP for ${number} cleared from memory after successful verification`);

        // Now retrieve the user from the database
        const user = await User.findOne({ number: number });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update the user's verified status
        user.verified = true; // Set verified to true
        await user.save(); // Save the changes to the database

        // Generate a JWT token for the user
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' }); // Set your expiration time

        // Return user details upon successful verification along with the token
        return res.status(200).json({
            message: 'Phone number verified successfully!',
            user: {
                id: user._id,
                number: user.number,
                name: user.name,
                role: user.role,
                verified: user.verified // Return the updated verified status
            },
            token // Include the token in the response
        });
    } catch (error) {
        console.error('Error verifying OTP:', error);
        return res.status(500).json({ message: 'Error verifying OTP', details: error.message });
    }
};


exports.resendOTP = async (req, res) => {
    const { number } = req.body;

    if (!number) {
        return res.status(400).json({ error: 'Recipient number is required' });
    }

    try {
        // Check if the number exists in the User model
        const user = await User.findOne({ number: number });

        if (!user) {
            return res.status(404).json({ message: 'Phone number not registered' });
        }

        // Generate a new OTP
        const otp = generateOTP();
        console.log(`Generated OTP for ${number}: ${otp}`);

        // Calculate the new expiration time
        const expirationTime = Date.now() + OTP_EXPIRATION_TIME;

        // Update the OTP in the store (overwrite the previous OTP)
        otpStore[number] = { otp, expirationTime };
        console.log(`Stored new OTP for ${number}: ${otpStore[number].otp}, expires at: ${new Date(otpStore[number].expirationTime).toISOString()}`);

        // Append the OTP to the predefined message
        const fullMessage = `${DEFAULT_MESSAGE} Your new OTP is: ${otp}`;

        const requestPayload = {
            api_key: API_KEY,
            sender: SENDER_NUMBER,
            number,
            message: fullMessage,
        };

        // Send OTP via WhatsApp API
        const response = await axios.post(API_URL, requestPayload, {
            httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false }),
        });

        // Check if the response indicates a successful message send
        if (response.status === 200 && response.data && response.data.status === true) {
            console.log(`Message sent successfully to ${number}`);
            return res.status(200).json({
                success: true,
                message: 'OTP resent successfully',
                data: response.data,
                otp: otp // For testing purposes, you can return the OTP in development
            });
        } else {
            console.error(`Failed to resend OTP: ${response.status}`, response.data);
            return res.status(response.status).json({
                success: false,
                error: 'Failed to resend message',
                details: response.data
            });
        }

    } catch (error) {
        console.error('Error checking phone number or resending OTP:', error);
        return res.status(500).json({ success: false, error: 'Internal server error', details: error.message });
    }
};
exports.editProfile = async (req, res) => {
    try {
        // Extract the token from the header
        const token = req.header('Authorization').replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ message: 'Authorization token required' });
        }

        // Verify the token
        const decoded = jwt.verify(token, JWT_SECRET); // Use your JWT secret key
        const userId = decoded.userId;

        // Extract name and number from the request body
        const { name, number } = req.body;

        // Check if the new number is already taken by another user
        const existingUser = await User.findOne({ number: number });

        if (existingUser && existingUser._id.toString() !== userId) {
            return res.status(400).json({ message: 'This phone number is already registered to another user.' });
        }

        // Find the user by ID and update their profile
        const user = await User.findByIdAndUpdate(
            userId, 
            { name: name, number: number }, 
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Send a success response with the updated user data
        res.status(200).json({ message: 'Profile updated successfully', user });

    } catch (error) {
        res.status(500).json({ message: 'Error updating profile', error: error.message });
    }
};
// Delete user by ID
exports.deleteUser = async (req, res) => {
    try {
        const userNumber = req.body.number; // Request body se user ka number le rahe hain

        if (!userNumber) {
            return res.status(400).json({ message: 'User number is required' });
        }

        // User ko uske unique number ke through delete kar rahe hain
        const user = await User.findOneAndDelete({ number: userNumber });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Success response bhejna
        res.status(200).json({ message: 'User deleted successfully', user });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

exports.getProfile = async (req, res) => {
    try {
        // Extract token from Authorization header
        const token = req.header('Authorization').replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ message: 'Authorization token required' });
        }

        // Verify the token
        const decoded = jwt.verify(token, JWT_SECRET);
        const userId = decoded.userId;

        // Find the user by ID and select the fields accordingly
        const user = await User.findById(userId).select('name _id number address role latitude longitude');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Build response object with user details
        const response = {
            name: user.name,
            id: user._id,
            number: user.number,
            address: user.address || 'No address provided',
            role: user.role,
        };

        // Add latitude and longitude only if they are present in the database
        if (user.latitude) {
            response.latitude = user.latitude;
        } else {
            response.latitude = 'Latitude is not available.';
        }

        if (user.longitude) {
            response.longitude = user.longitude;
        } else {
            response.longitude = 'Longitude is not available.';
        }

        // Send the response with user details
        return res.status(200).json(response);

    } catch (error) {
        res.status(500).json({ message: 'Error retrieving profile', error: error.message });
    }
};


exports.updateAddress = async (req, res) => {
    try {
        // Extract token from Authorization header
        const token = req.header('Authorization').replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ message: 'Authorization token required' });
        }

        // Verify the token
        const decoded = jwt.verify(token, JWT_SECRET);
        const userId = decoded.userId;

        // Extract address, latitude, and longitude from request body
        const { address, latitude, longitude } = req.body;

        if (!address ) {
            return res.status(400).json({ message: 'Address, latitude, and longitude are required' });
        }

        // Update the user's address, latitude, and longitude
        const user = await User.findByIdAndUpdate(
            userId,
            {
                $set: {
                    address: address,
                    latitude: latitude,
                    longitude: longitude
                }
            },
            { new: true } // To return the updated user
        ).select('name _id number address latitude longitude role'); // Ensure latitude is included here

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Send a response with the updated user details
        return res.status(200).json({
            message: 'Address updated successfully',
            user: {
                name: user.name,
                id: user._id,
                number: user.number,
                address: user.address,
                latitude: user.latitude, // Ensure latitude is included in the response
                longitude: user.longitude,
                role: user.role
            }
        });

    } catch (error) {
        res.status(500).json({ message: 'Error updating address', error: error.message });
    }
};

