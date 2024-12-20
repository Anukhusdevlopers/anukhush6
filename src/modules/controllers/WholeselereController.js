const Wholesaler = require('../models/WholeSeler');
const jwt = require('jsonwebtoken');
require('dotenv').config(); // Load environment variables
const axios = require('axios'); // Add this line
const User = require('../models/AnuUser');  // Customer model
const DeliveryBoy = require('../models/DeliveryBoyNew');
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
// Assign Wholesaler by Admin
// Assign Wholesaler by Admin
exports.assignWholesaler = async (req, res) => {
  const { name, address, email, aadharNo, panNo, turnover, number, assignedBy, role } = req.body;

  try {
    // Check if the number exists in either the Customer (User) or Wholesaler model
    const existingUser = await User.findOne({ number });
    const existingWholesaler = await DeliveryBoy.findOne({ number });

    if (existingUser) {
      return res.status(400).json({ error: "This number is already registered as a customer" });
    }

    if (existingWholesaler) {
      return res.status(400).json({ error: "This number is already registered as DeliveryBoy" });
    }

    // Validate the role
    if (!['junkyard', 'dumpingYard'].includes(role)) {
      return res.status(400).json({ error: "Invalid role. Role must be 'junkyard' or 'dumpingYard'." });
    }

    // Create a new wholesaler instance
    const wholesaler = new Wholesaler({
      name,
      address,
      email,
      aadharNo,
      panNo,
      turnover,
      number,
      assignedBy,
      role, // Assign the role here
    });

    // Save the wholesaler to the database
    await wholesaler.save();

    // Generate JWT Token
    const token = jwt.sign(
      { id: wholesaler._id, role: 'admin' }, 
      'your_secret_key', 
      { expiresIn: '7d' }
    );

    // Respond with the wholesaler's ID, the created wholesaler object, and the token
    res.status(201).json({ 
      message: "Wholesaler assigned successfully", 
      wholesalerId: wholesaler._id,  // Send the wholesaler ID explicitly
      wholesaler,
      token // Include the token in the response
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getwholeselerById = async (req, res) => {
  const { id } = req.params;

  try {
    const deliveryBoys = await Wholesaler.find({ assignedBy: id }); // Find delivery boys by adminid ID

    res.status(200).json({
      count: deliveryBoys.length, // Count of delivery boys
      deliveryBoys // Delivery boys array
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.WholesalerLogin = async (req, res) => {
  const { number, role } = req.body;

  if ( !number || !role) {
    return res.status(400).json({ error: ' number, and role are required' });
  }

  try {
    // Check if the wholesaler exists by number and role
    const wholesaler = await Wholesaler.findOne({ number, role });

    if (!wholesaler) {
      return res.status(404).json({ message: 'Wholesaler not found with the provided role' });
    }

   
    // Generate and store OTP
    const otp = generateOTP();
    const expirationTime = Date.now() + OTP_EXPIRATION_TIME;
    otpStore[number] = { otp, expirationTime };

    // Prepare and send the OTP message
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

    if (response.status === 200 && response.data.status === true) {
      return res.status(200).json({
        success: true,
        message: 'OTP sent successfully',
        wholesaler: {
          id: wholesaler._id,
          name: wholesaler.name,
          number: wholesaler.number,
          role: wholesaler.role, // Include the role in the response
        },
        otp, // For testing, remove this in production
      });
    } else {
      return res.status(response.status).json({
        success: false,
        error: 'Failed to send OTP',
      });
    }
  } catch (error) {
    console.error('Error during wholesaler login:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};


// Verify OTP function (optional, for verification after OTP is received)
exports.verifyOTP = async (req, res) => {
  const { otp } = req.body;

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

    // Retrieve the user from the database
    const user = await Wholesaler.findOne({ number: number });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update the user's verified status
    user.verified = true;
    await user.save();

    // Generate a JWT token for the user
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Return user details upon successful verification along with the token
    return res.status(200).json({
      message: 'Phone number verified successfully!',
      user: {
        id: user._id,
        name: user.name,
        address: user.address,
        email: user.email,
        aadharNo: user.aadharNo,
        panNo: user.panNo,
        turnover: user.turnover,
        phoneNumber: user.number,
        assignedBy: user.assignedBy,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        verified: user.verified,
      },
      token
    });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return res.status(500).json({ message: 'Error verifying OTP', details: error.message });
  }
};

// Get all Wholesalers assigned by an Admin
exports.getWholesalersByAdmin = async (req, res) => {
  
    try {
      const wholesalers = await Wholesaler.find(); // Fetch all wholesalers
      res.status(200).json({ wholesalers });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }

};
exports.deactivateWholeseler = async (req, res) => {
  const { id } = req.params;

  try {
    // Find the delivery boy by ID and set isActive to false
    const wholesaler = await Wholesaler.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!wholesaler) {
      return res.status(404).json({ success: false, message: 'wholesaler not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'wholesaler deactivated successfully',
      wholesaler,
    });
  } catch (error) {
    console.error('Error deactivating delivery boy:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};
exports.getTodaysWholesalers = async (req, res) => {
  try {
    // Get the start and end times for today's date
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // Find wholesalers created within today's date range
    const wholesalers = await Wholesaler.find({
      createdAt: { $gte: startOfDay, $lte: endOfDay },
    });

    return res.status(200).json({
      success: true,
      message: 'Wholesalers registered today fetched successfully',
      wholesalers, // All data of each wholesaler will be included here
    });
  } catch (error) {
    console.error('Error fetching today’s wholesalers:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

exports.getProfileWholeseler = async (req, res) => {
  try {
      const token = req.header('Authorization')?.replace('Bearer ', '').trim();
      console.log("Token received:", token);

      if (!token) {
          return res.status(401).json({ message: 'Authorization token required' });
      }

      const decoded = jwt.verify(token, JWT_SECRET);
      const userId = decoded.userId;
      console.log("Decoded User ID:", userId);

      const user = await Wholesaler.findById(userId).select(
          'name _id address email aadharNo panNo turnover phoneNumber assignedBy createdAt updatedAt'
      );

      if (!user) {
          return res.status(404).json({ message: 'User not found' });
      }

      return res.status(200).json(user);
  } catch (error) {
      console.error("Error retrieving profile:", error);
      if (error.name === 'JsonWebTokenError') {
          return res.status(401).json({ message: 'Invalid token', error: error.message });
      }
      res.status(500).json({ message: 'Error retrieving profile', error: error.message });
  }
};
