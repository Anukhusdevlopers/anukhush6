const Wholesaler = require('../models/WholeSeler');
const jwt = require('jsonwebtoken');
require('dotenv').config(); // Load environment variables
const axios = require('axios'); // Add this line

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
  const { name, address, email, aadharNo, panNo, turnover, number, assignedBy } = req.body;

  try {
    // Create a new wholesaler instance
    const wholesaler = new Wholesaler({
      name,
      address,
      email,
      aadharNo,
      panNo,
      turnover,
      number,
      assignedBy
    });

    // Save the wholesaler to the database
    await wholesaler.save();

    // Generate JWT Token
    const token = jwt.sign(
      { id: wholesaler._id, role: 'admin' }, 
      'your_secret_key', 
      { expiresIn: '1h' }
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
exports.WholesalerLogin = async (req, res) => {
  const { name, number } = req.body;

  if (!name || !number) {
      return res.status(400).json({ error: 'Name and number are required' });
  }

  try {
      // Check if the wholesaler exists by name and number
      const wholesaler = await Wholesaler.findOne({  number });

      if (!wholesaler) {
          return res.status(404).json({ message: 'Wholesaler not found' });
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
exports.verifyOTP = (req, res) => {
  const { otp } = req.body;

  // Check if OTP is provided
  if (!otp) {
    return res.status(400).json({ error: 'OTP is required' });
  }

  // Search for the OTP in the otpStore
  let matchingNumber = null;
  for (const number in otpStore) {
    if (otpStore[number].otp === otp) {
      matchingNumber = number;
      break;
    }
  }

  // If no matching OTP found
  if (!matchingNumber) {
    return res.status(400).json({ error: 'Invalid OTP' });
  }

  const { expirationTime } = otpStore[matchingNumber];

  // Check if the OTP has expired
  if (Date.now() > expirationTime) {
    return res.status(400).json({ error: 'OTP has expired' });
  }

  // OTP is valid, generate JWT token using the phone number (matchingNumber)
  const token = jwt.sign({ id: matchingNumber }, JWT_SECRET, { expiresIn: '1h' });

  return res.status(200).json({ success: true, message: 'OTP verified', token });
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
