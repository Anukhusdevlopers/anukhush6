const DeliveryBoy = require('../models/DeliveryBoyNew');
const jwt = require('jsonwebtoken');
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
// Assign Delivery Boy by Wholesaler
// Assign Delivery Boy by Wholesaler
exports.assignDeliveryBoy = async (req, res) => {
  const { name, addresses, email, aadharNo, panNo, vehicleType, licenseNo, number, assignedBy } = req.body;

  try {
    // Check if the number of addresses exceeds the limit
    if (addresses.length > 5) {
      return res.status(400).json({ error: "A delivery boy can have at most 5 addresses." });
    }

    // Fetch existing delivery boy or create a new one
    let deliveryBoy = await DeliveryBoy.findOne({ email}); // Assuming email is unique

    if (!deliveryBoy) {
      // Directly use addresses as an array of strings
      deliveryBoy = new DeliveryBoy({
        name,
        address: addresses, // Store as an array of strings
        email,
        aadharNo,
        panNo,
        vehicleType,
        licenseNo,
        number,
        assignedBy
      });
    } else {
      // If the delivery boy already exists, update the addresses
      // Combine existing addresses and new ones without exceeding the limit
      const combinedAddresses = [...new Set([...deliveryBoy.address, ...addresses])]; // Combine and remove duplicates
      if (combinedAddresses.length > 5) {
        return res.status(400).json({ error: "A delivery boy can have at most 5 addresses." });
      }
      deliveryBoy.address = combinedAddresses; // Update the addresses
    }

    await deliveryBoy.save();

    // Generate JWT Token
    const token = jwt.sign({ id: deliveryBoy._id, role: 'wholesaler' }, 'your_secret_key', { expiresIn: '1h' });

    res.status(201).json({
      message: "Delivery Boy assigned successfully",
      deliveryBoy: {
        ...deliveryBoy.toObject(), // Convert to plain object
        address: deliveryBoy.address, // Ensure address is in the correct format
      },
      token // Include the token in the response
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
exports.getDeliveryBoysByWholesalerId = async (req, res) => {
  const { id } = req.params;

  try {
    const deliveryBoys = await DeliveryBoy.find({ assignedBy: id }); // Find delivery boys by wholesaler ID

    res.status(200).json({
      count: deliveryBoys.length, // Count of delivery boys
      deliveryBoys // Delivery boys array
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
  exports.deliveryboyLogin = async (req, res) => {
    const { name, number } = req.body;
  
    if (!name || !number) {
        return res.status(400).json({ error: 'Name and number are required' });
    }
  
    try {
        // Check if the wholesaler exists by name and number
        const wholesaler = await DeliveryBoy.findOne({  number });
  
        if (!wholesaler) {
            return res.status(404).json({ message: 'delivery not found' });
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
        console.error('Error during delivery login:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
  };
  
  // Verify OTP function (optional, for verification after OTP is received)
  exports.verifyOTPDeliveryboy = (req, res) => {
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
  
// Get all Delivery Boys assigned by Wholesaler
exports.getDeliveryBoysByWholesaler = async (req, res) => {
  try {
    const deliveryBoys = await DeliveryBoy.find();
    res.status(200).json({ deliveryBoys });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
