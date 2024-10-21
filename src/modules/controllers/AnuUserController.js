const User = require('../models/AnuUser'); // Correct path to the User model
const RateList = require('../models/RateList');
const slugify = require('slugify');
const Otp = require('../models/otp');
const twilio = require('twilio');
const jwt = require('jsonwebtoken'); // Import jsonwebtoken

const secretKey = process.env.JWT_SECRET_KEY || 'yourSecretKey'; // Use an environment variable for the secret key
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;


const client = twilio(accountSid, authToken);

const axios = require('axios');

// Function to send OTPconst axios = require('axios');

// Function to send OTP via WhatsApp
exports.sendOtp1 = async (req, res) => {
    const { number, message } = req.body; // Get number and message from request body

    const apiUrl = "https://api.your-whatsapp-service.com/send-message"; // Replace with your actual API endpoint
    const apiKey = "dIDMppN9BL3MQcm9QeAzGidcnj6Iyc"; // Your generated API key
    const sender = "8707087926"; // Your registered WhatsApp number

    try {
        // Prepare request payload
        const payload = {
            api_key: apiKey,
            sender: sender,
            number: number, // Ensure the number includes the country code
            message: message || "Your OTP is: " + Math.floor(100000 + Math.random() * 900000), // Generate a random OTP if message not provided
        };

        // Send POST request to the WhatsApp API
        const response = await axios.post(apiUrl, payload);

        // Check the response from the API
        if (response.data.success) {
            return res.status(200).json({
                message: "OTP sent successfully",
                data: response.data,
            });
        } else {
            return res.status(400).json({
                message: "Failed to send OTP",
                error: response.data.error || "Unknown error",
            });
        }
    } catch (error) {
        console.error("Error sending OTP:", error);
        return res.status(500).json({
            message: "Error sending OTP",
            error: error.message || "Server error",
        });
    }
};


// Function to generate OTP (for demonstration purposes)
const generateOtp = () => {
    return Math.floor(100000 + Math.random() * 900000); // Generates a random 6-digit OTP
};





exports.sendOtp = async (req, res) => {
    const { phoneNumber } = req.body;

    try {
        // Check if an OTP already exists for the phone number
        let existingOtp = await Otp.findOne({ phoneNumber });

        // If an OTP exists, check if it has expired
        if (existingOtp) {
            if (existingOtp.otpExpires > Date.now()) {
                return res.status(400).json({ message: 'OTP already sent. Please wait before requesting again.' });
            } else {
                // OTP has expired, so we can proceed to generate a new one
                await Otp.deleteOne({ phoneNumber }); // Remove the expired OTP
            }
        }

        const otp = generateOtp();
        const otpExpires = Date.now() + 300000; // 5 minutes expiry

        // Send OTP using Twilio
        await client.messages.create({
            body: `Your OTP is: ${otp}`,
            from: 'whatsapp:+14155238886',
            to: `whatsapp:${phoneNumber}`
        });

        // Save the new OTP with expiration time
        const newOtp = new Otp({ phoneNumber, otp, otpExpires });
        await newOtp.save();

        res.status(200).json({ message: 'OTP sent successfully' }); // Remove otp in production for security
    } catch (error) {
        console.error('Error sending OTP:', error);
        res.status(500).json({ message: 'Failed to send OTP' });
    }
};

// Verify the OTP
exports.verifyOtp = async (req, res) => {
    const { phoneNumber, otp } = req.body;

    try {
        const otpRecord = await Otp.findOne({ phoneNumber });

        if (!otpRecord) {
            return res.status(400).json({ message: 'OTP not found' });
        }

        if (otpRecord.otp.trim() !== otp.trim()) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        const existingUser = await User.findOne({ phoneNumber });

        if (!existingUser) {
            return res.status(400).json({ message: 'User not found' });
        }

        // Fetch address using geolocation (dummy function here)
        const address = await getGeolocationAddress(req); // Implement this function based on your geolocation service

        // Update the user with the address
        existingUser.address = address; // Set the address
        existingUser.verified = true; // Mark as verified
        await existingUser.save();

        const token = jwt.sign(
            {
                id: existingUser._id,
                phoneNumber: existingUser.phoneNumber,
                role: existingUser.role,
                address: existingUser.address // Include address in token if needed
            },
            secretKey,
            { expiresIn: '1h' }
        );

        return res.status(200).json({
            message: 'OTP verified successfully',
            user: {
                id: existingUser._id,
                name: existingUser.name,
                role: existingUser.role,
                phoneNumber: existingUser.phoneNumber,
                address: existingUser.address,
            },
            token
        });
    } catch (error) {
        console.error('Error verifying OTP:', error);
        res.status(500).json({ message: 'Failed to verify OTP' });
    }
};

// Dummy function for geolocation (implement as needed)
async function getGeolocationAddress(req) {
    // Logic to fetch address based on user's geolocation
    // You can use a geolocation API service here
    return "User's Geolocation Address"; // Replace with actual address fetching logic

};
// resend otp 
// Controller to resend OTP via WhatsApp
exports.resendOtp = async (req, res) => {
    const { phoneNumber } = req.body;

    try {
        // Find the existing OTP entry for the phone number
        const existingOtp = await Otp.findOne({ phoneNumber });

        // Check if OTP was sent recently (within 1 minute, or any time you decide)
        if (existingOtp && Date.now() - existingOtp.createdAt < 1 * 60 * 1000) {
            return res.status(400).json({
                message: 'Please wait before requesting another OTP.'
            });
        }

        // Generate a new OTP
        const otp = generateOtp();

        // Send the new OTP using Twilio
        await client.messages.create({
            body: `Your OTP is: ${otp}`,
            from: 'whatsapp:+14155238886',
            to: `whatsapp:${phoneNumber}`
        });

        if (existingOtp) {
            // Update the existing OTP with the new one
            existingOtp.otp = otp;
            existingOtp.createdAt = Date.now(); // Update the timestamp
            await existingOtp.save();
        } else {
            // Create a new OTP entry if not found
            const newOtp = new Otp({ phoneNumber, otp });
            await newOtp.save();
        }

        res.status(200).json({ message: 'OTP resent successfully', otp }); // Remove `otp` from response in production
    } catch (error) {
        console.error('Error resending OTP:', error);
        res.status(500).json({ message: 'Failed to resend OTP' });
    }
};
exports.registerUser = async (req, res) => {
    const { number, role, name, address } = req.body;

    try {
        // Check if phone number already exists
        const existingUser = await User.findOne({ number });

        if (existingUser) {
            return res.status(400).json({
                message: `Phone number is already registered as ${existingUser.role}.`
            });
        }

        // Generate a 6-digit OTP
       

        // Create a new user based on role
        const newUser = new User({
            number,
            role,
            name,
            ...(role === 'customer' && { address }),
            
        });

        await newUser.save();

        // Generate JWT token
        const token = jwt.sign(
            {
                id: newUser._id,
                number: newUser.number,
                role: newUser.role,
            },
            secretKey,
            { expiresIn: '1h' } // Set token expiration time
        );

        // Return the user data along with the token
        return res.status(201).json({
            message: 'User registered successfully!',
            user: {
                id: newUser._id,
                number: newUser.number,
                role: newUser.role,
                name: newUser.name,
                address: newUser.address || null,
                
            },
          token // Include the token in the response
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error registering user' });
    }
};
exports.getAllUsers = async (req, res) => {
    try {
        // Find all users in the database
        const users = await User.find();

        if (users.length === 0) {
            return res.status(404).json({ message: 'No users found' });
        }

        // Return the users
        return res.status(200).json(users);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error fetching users' });
    }
};
// Controller for user login using phone number and name
// Controller for user login using phone number and name
// Controller for user login using phone number and name

exports.loginUser = async (req, res) => {
    const { number, name, role } = req.body;

    try {
        // Check if the user exists
        let user = await User.findOne({ number });

        if (user) {
            // Check if the role matches
            if (user.role !== role) {
                return res.status(400).json({
                    message: "This phone number is already registered as a " + user.role + ". Please use the correct role."
                });
            }

            // User exists with the same role, generate JWT token
            const token = jwt.sign(
                { id: user._id, number: user.number, role: user.role },
                secretKey,
                { expiresIn: '1h' }
            );

            return res.status(200).json({
                message: "User logged in successfully!",
                user: {
                    id: user._id,
                    number: user.number,
                    name: user.name,
                    role: user.role,
                    address: user.address
                },
                token // Include the token in the response
            });
        } else {
            // Create a new user since the phone number doesn't exist
            user = new User({ number, name, role });
            await user.save();

            // Generate JWT token for the new user
            const token = jwt.sign(
                { id: user._id, number: user.number, role: user.role },
                secretKey,
                { expiresIn: '1h' }
            );

            return res.status(201).json({
                message: "User registered and logged in successfully!",
                user: {
                    id: user._id,
                    number: user.number,
                    name: user.name,
                    role: user.role,
                    address: user.address
                },
                token // Include the token in the response
            });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
};


//verify and generte otp 
// In-memory OTP store
const otpStore = {};

// Controller to generate and send OTP via WhatsApp
exports.generateAndSendOTP = async (req, res) => {
    const { phoneNumber } = req.body;

    try {
        // Check if user exists
        const user = await User.findOne({ phoneNumber });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Generate a 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Set OTP expiration time (e.g., 5 minutes from now)
        const expirationTime = Date.now() + 5 * 60 * 1000;

        // Store the OTP in memory with expiration time
        otpStore[phoneNumber] = { otp, expirationTime };

        // Replace this with actual WhatsApp API logic to send the OTP
        console.log(`WhatsApp OTP for ${phoneNumber}: ${otp}`); 

        return res.status(200).json({ message: 'OTP sent via WhatsApp!' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error generating OTP' });
    }
};

// Controller to verify OTP
exports.verifyOTP = async (req, res) => {
    const { phoneNumber, otp } = req.body;

    try {
        // Retrieve the OTP details from in-memory store
        const storedOtpDetails = otpStore[phoneNumber];

        if (!storedOtpDetails) {
            return res.status(400).json({ message: 'OTP not found or expired' });
        }

        const { otp: storedOtp, expirationTime } = storedOtpDetails;

        // Check if OTP matches and is not expired
        if (storedOtp !== otp || Date.now() > expirationTime) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        // OTP verification successful, clear the OTP from the in-memory store
        delete otpStore[phoneNumber];

        return res.status(200).json({ message: 'Phone number verified successfully!' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error verifying OTP' });
    }
};
// Controller to create a new rate list item
exports.createRateList = async (req, res) => {
    const { name, price, OnlyPrice } = req.body;

    try {
        // Automatically generate slug from the name
        const slug = slugify(name, { lower: true, strict: true });

        // Check if the slug already exists
        const existingItem = await RateList.findOne({ slug });
        if (existingItem) {
            return res.status(400).json({ message: 'Slug already exists!' });
        }

        // Create a new rate list item
        const newItem = new RateList({
            name,
            price,
            OnlyPrice,
            slug
        });

        await newItem.save();

        return res.status(201).json({
            message: 'Rate list item created successfully!',
            item: newItem
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error creating rate list item' });
    }
};
// Controller to get all rate list items
exports.getAllRateLists = async (req, res) => {
    try {
        const rateLists = await RateList.find(); // Fetch all rate list items
        if (rateLists.length === 0) {
            return res.status(404).json({ message: 'No rate list items found' });
        }
        return res.status(200).json(rateLists);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error fetching rate list items' });
    }
};

// Controller to get a rate list item by slug
exports.getRateListBySlug = async (req, res) => {
    const { slug } = req.params;

    try {
        const rateList = await RateList.findOne({ slug }); // Find by slug
        if (!rateList) {
            return res.status(404).json({ message: 'Rate list item not found' });
        }
        return res.status(200).json(rateList);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error fetching rate list item' });
    }
};

// Edit profile controller
exports.editProfile = async (req, res) => {
    try {
        // Directly using the provided token
        const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2ZmJkNGNhNDEzNzUwNjRkODFiNDU2MSIsInBob25lTnVtYmVyIjoiODc1NjM0NTY3NyIsInJvbGUiOiJkZWxpdmVyeUFnZW50IiwiaWF0IjoxNzI3NzgxMjA1LCJleHAiOjE3Mjc3ODQ4MDV9.kGhCraojCga3ptWtAT5WWGVIIj2Of666S6ZmJA8iw3I';
        
        // Verify the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET); // Make sure the secret is correct
        const userId = decoded.id;

        // Find the user by ID
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update user fields
        const updatedFields = {};
        if (req.body.name) updatedFields.name = req.body.name;
        if (req.body.email) updatedFields.email = req.body.email;
        if (req.body.phone) updatedFields.phone = req.body.phone;

        // Update the user profile
        const updatedUser = await User.findByIdAndUpdate(userId, updatedFields, { new: true });
        
        return res.status(200).json({
            message: 'Profile updated successfully!',
            user: updatedUser
        });
    } catch (error) {
        console.error('Error updating profile:', error);
        
        // Handle specific error types
        if (error instanceof jwt.JsonWebTokenError) {
            return res.status(401).json({ message: 'Invalid token' });
        } else {
            return res.status(500).json({ message: 'Internal server error' });
        }
    }
};