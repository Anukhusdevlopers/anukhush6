const DeliveryBoy = require('../models/DeliveryBoyNew');
const ScrapItem = require("../models/Scraplist");

const jwt = require('jsonwebtoken');
const axios = require('axios'); // Add this line
const mongoose = require('mongoose');
const User = require('../models/AnuUser');  // Customer model
const Wholesaler = require('../models/WholeSeler');  // Wholesaler model
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
  const { name, addresses, email, aadharNo, panNo, vehicleType, licenseNo, number, assignedBy, location } = req.body;

  // Check if location is provided
  if (!location) {
    return res.status(400).json({ error: "Location is required." });
  }

  try {
    // Extract latitude and longitude dynamically (example: from a geolocation API or request body)
    const { latitude, longitude } = req.body;
   

    // Check if the number exists in either the Customer (User) or Wholesaler model
    const existingUser = await User.findOne({ number });
    const existingWholesaler = await Wholesaler.findOne({ number });

    if (existingUser) {
      return res.status(400).json({ error: "This number is already registered as a customer" });
    }

    if (existingWholesaler) {
      return res.status(400).json({ error: "This number is already registered as Wholesaler" });
    }

    // Check if the number of addresses exceeds the limit
    if (addresses.length > 5) {
      return res.status(400).json({ error: "A delivery boy can have at most 5 addresses." });
    }

    // Fetch existing delivery boy or create a new one
    let deliveryBoy = await DeliveryBoy.findOne({ email }); // Assuming email is unique

    if (!deliveryBoy) {
      // Create new delivery boy
      deliveryBoy = new DeliveryBoy({
        name,
        address: addresses,
        email,
        aadharNo,
        panNo,
        vehicleType,
        licenseNo,
        number,
        assignedBy,
        location,
        latitude, // Include latitude
        longitude, // Include longitude
        status: 'current',
      });
    } else {
      // Update the existing delivery boy
      const combinedAddresses = [...new Set([...deliveryBoy.address, ...addresses])];
      if (combinedAddresses.length > 5) {
        return res.status(400).json({ error: "A delivery boy can have at most 5 addresses." });
      }
      deliveryBoy.address = combinedAddresses;
      deliveryBoy.location = location;
      deliveryBoy.latitude = latitude; // Update latitude
      deliveryBoy.longitude = longitude; // Update longitude
      deliveryBoy.status = 'current';
    }

    await deliveryBoy.save();

    // Generate JWT Token
    const token = jwt.sign({ id: deliveryBoy._id, role: 'wholesaler' }, 'your_secret_key', { expiresIn: '1h' });

    res.status(201).json({
      message: "Delivery Boy assigned successfully",
      deliveryBoy: {
        ...deliveryBoy.toObject(),
        address: deliveryBoy.address,
        location: deliveryBoy.location,
        latitude: deliveryBoy.latitude, // Ensure latitude is returned
        longitude: deliveryBoy.longitude, // Ensure longitude is returned
      },
      token,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
exports.getDeliveryBoysByWholesalerId = async (req, res) => {
  const { id } = req.params; // delivery boy's ID

  try {
    // Find and update the delivery boy's status to 'previous'
    const updatedDeliveryBoy = await DeliveryBoy.findByIdAndUpdate(
      id, // Use the delivery boy's ID
      { status: 'previous' }, // Set status to 'previous'
      { new: true } // Return the updated document
    );

    if (!updatedDeliveryBoy) {
      return res.status(404).json({ message: "Delivery Boy not found." });
    }

    res.status(200).json({
      message: "Delivery Boy deactivated successfully",
      deliveryBoy: updatedDeliveryBoy
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
  exports.verifyOTPDeliveryboy = async (req, res) => {
    const { otp } = req.body;
  
    if (!otp) {
      return res.status(400).json({ message: 'OTP is required' });
    }
  
    try {
      const userEntry = Object.entries(otpStore).find(([key, value]) => value.otp === otp);
  
      if (!userEntry) {
        return res.status(400).json({ message: 'Invalid or expired OTP' });
      }
  
      const number = userEntry[0];
      delete otpStore[number];
  
      const user = await DeliveryBoy.findOne({ number: number });
  
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      // Ensure `location` is set before saving
      if (!user.location) {
        user.location = "default location"; // Add appropriate default or fetch logic
      }
  
      user.verified = true;
      await user.save();
  
      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  
      return res.status(200).json({
        message: 'Phone number verified successfully!',
        user: {
          id: user._id,
          name: user.name,
          address: user.address,
          email: user.email,
          aadharNo: user.aadharNo,
          panNo: user.panNo,
          vehicleType: user.vehicleType,
          licenseNo: user.licenseNo,
          phoneNumber: user.number,
          isActive: user.isActive,
          assignedBy: user.assignedBy,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          verified: user.verified,
          __v: user.__v
        },
        token
      });
    } catch (error) {
      console.error('Error verifying OTP:', error);
      return res.status(500).json({ message: 'Error verifying OTP', details: error.message });
    }
  };
  
// Get all Delivery Boys assigned by Wholesaler
exports.getDeliveryBoysByWholesaler = async (req, res) => {
  const { wholesalerId } = req.params; // Expect wholesalerId as a URL parameter

  try {
    // Find delivery boys assigned by this specific wholesaler
    const deliveryBoys = await DeliveryBoy.find({ assignedBy: wholesalerId });

    // Check if delivery boys are found
    if (deliveryBoys.length === 0) {
      return res.status(404).json({ message: "No delivery boys found for this wholesaler." });
    }

    res.status(200).json({ deliveryBoys });
  } catch (error) {
    console.error("Error fetching delivery boys by wholesaler:", error);
    res.status(500).json({ error: error.message });
  }
};
exports.deactivateDeliveryBoy = async (req, res) => {
  const { id } = req.params;

  try {
    // Find the delivery boy by ID and set isActive to false
    const deliveryBoy = await DeliveryBoy.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!deliveryBoy) {
      return res.status(404).json({ success: false, message: 'Delivery boy not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Delivery boy deactivated successfully',
      deliveryBoy,
    });
  } catch (error) {
    console.error('Error deactivating delivery boy:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// controllers/deliveryBoyController.js


exports.updateDeliveryBoyAddress = async (req, res) => {
  const { id } = req.params;
  const { address } = req.body;

  if (!address || !Array.isArray(address)) {
    return res.status(400).json({ success: false, message: 'Address must be a non-empty array of strings' });
  }

  try {
    // Update only the address field
    const updatedDeliveryBoy = await DeliveryBoy.findByIdAndUpdate(
      id,
      { address },
      { new: true, runValidators: true }
    );

    if (!updatedDeliveryBoy) {
      return res.status(404).json({ success: false, message: 'Delivery boy not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Address updated successfully',
      deliveryBoy: updatedDeliveryBoy, // Return updated document
    });
  } catch (error) {
    console.error('Error updating delivery boy address:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};
exports. getRequestsByStatus = async (req, res) => {
  const { status } = req.body; // Expecting status in the body

  try {
    // Validate the status
    if (!status || (status !== 'current' && status !== 'previous')) {
      return res.status(400).json({ error: "Invalid status. Must be 'current' or 'previous'." });
    }

    // Fetch requests based on status
    const requests = await DeliveryBoy.find({ status });

    // Check if requests are found
    if (requests.length === 0) {
      console.log(`No ${status} requests found.`);
    }

    res.status(200).json(requests);
  } catch (error) {
    console.error("Error fetching requests:", error.message);
    res.status(500).json({ error: error.message });
  }
};
exports.getProfileDeliveryBoy = async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '').trim();
    console.log("Token received:", token); // Log the received token

    if (!token) {
      return res.status(401).json({ message: 'Authorization token required' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId;
    console.log("Decoded User ID:", userId);

    const user = await DeliveryBoy.findById(userId).select(
      'name _id address email aadharNo panNo vehicleType licenseNo number assignedBy isActive createdAt updatedAt'
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({
      message: 'Profile retrieved successfully',
      user: {
        name: user.name,
        _id: user._id,
        address: user.address,
        email: user.email,
        aadharNo: user.aadharNo,
        panNo: user.panNo,
        vehicleType: user.vehicleType,
        licenseNo: user.licenseNo,
        number: user.number,
        assignedBy: user.assignedBy,
        isActive: user.isActive, // Include the isActive field in the response
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error retrieving profile:", error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token', error: error.message });
    }
    res.status(500).json({ message: 'Error retrieving profile', error: error.message });
  }
};

// Get all delivery boys without filtering by status
exports.getAllDeliveryBoys = async (req, res) => {
  try {
    // Find all delivery boys
    const allDeliveryBoys = await DeliveryBoy.find();

    // Check if any delivery boys are found
    if (allDeliveryBoys.length === 0) {
      return res.status(404).json({ message: "No delivery boys found." });
    }

    res.status(200).json({
      message: "All delivery boys retrieved successfully.",
      deliveryBoys: allDeliveryBoys,  // Return the list of all delivery boys
    });
  } catch (error) {
    console.error("Error fetching delivery boys:", error);
    res.status(500).json({ error: error.message });
  }
};
exports.startDelivery = async (req, res) => {
  try {
    // Extract requestId and number (delivery boy's phone number) from the request body
    const { requestId, number } = req.body;

    if (!number) {
      return res.status(400).json({ message: "Delivery boy's number is required" });
    }

    // Find the delivery boy by their phone number
    const deliveryBoy = await DeliveryBoy.findOne({ number });

    if (!deliveryBoy) {
      return res.status(404).json({ message: "Delivery boy not found" });
    }

    // Generate OTP
    const otp = generateOTP();

    // Update the ScrapItem document with the generated OTP and associate the delivery boy
    const scrapItemUpdate = await ScrapItem.findOneAndUpdate(
      { requestId },
      {
        status: "inprogress", // Change status to 'inprogress'
        otp,
        deliveryBoy: deliveryBoy._id, // Use the delivery boy's ID
      },
      { new: true } // Return the updated document
    );

    if (!scrapItemUpdate) {
      return res.status(404).json({ message: "Scrap Item not found" });
    }

    // Save the OTP in the delivery boy's record for later verification
    await DeliveryBoy.findByIdAndUpdate(
      deliveryBoy._id,
      { otp, isActive: true }, // Add OTP to the delivery boy's record
      { new: true }
    );

    // Populate the ScrapItem with the delivery boy's details
    const populatedScrapItem = await ScrapItem.findOne({ requestId }).populate('deliveryBoy');

    // Respond with success, returning the OTP and ScrapItem with delivery boy details
    return res.status(200).json({
      message: "Delivery started successfully",
      otp, // Return the OTP for client-side use
      scrapItem: {
        ...populatedScrapItem.toObject(), // Convert ScrapItem document to plain object
        deliveryBoy: undefined, // Remove redundant deliveryBoy details
      },
      deliveryBoy: {
        _id: deliveryBoy._id,
        name: deliveryBoy.name,
        number: deliveryBoy.number,
        email: deliveryBoy.email,
        isActive: deliveryBoy.isActive,
        location: deliveryBoy.location,
      }, // Include only necessary delivery boy details here
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error", error });
  }
};



exports.verifyDeliveryOtp = async (req, res) => {
  try {
    // Step 1: Extract requestId and OTP from the request body
    const { requestId, otp } = req.body;

    // Step 2: Validate input (requestId and OTP should be provided)
    if (!requestId || !otp) {
      return res.status(400).json({ message: "Request ID and OTP are required" });
    }

    // Step 3: Find the ScrapItem by requestId to get the associated deliveryBoy
    const scrapItem = await ScrapItem.findOne({ requestId }).populate('deliveryBoy');
    
    // If ScrapItem not found, return error
    if (!scrapItem) {
      return res.status(404).json({ message: "Scrap Item not found" });
    }

    // Step 4: Get the delivery boy associated with this scrap item
    const deliveryBoy = scrapItem.deliveryBoy;

    // If no delivery boy associated with the ScrapItem, return error
    if (!deliveryBoy) {
      return res.status(404).json({ message: "Delivery Boy not found for this request" });
    }

    // Step 5: Check if the OTP matches the one stored in the DeliveryBoy record
    if (deliveryBoy.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // Step 6: Update the ScrapItem status to 'inprogress' and set isVerified to true
    scrapItem.status = "inprogress";  // Change status to 'inprogress' or 'completed' as required
    scrapItem.isVerified = true;  // Set isVerified to true
    await scrapItem.save();

    // Step 7: Clear the OTP from the DeliveryBoy and keep 'isActive' as true
    deliveryBoy.otp = null;  // Clear OTP after successful verification
    deliveryBoy.isActive = true;  // Ensure the delivery boy remains active
    await deliveryBoy.save();

    // Step 8: Send the response with the updated ScrapItem and DeliveryBoy data
    return res.status(200).json({
      message: "OTP verified successfully. Delivery confirmed.",
      scrapItem: {
        requestId: scrapItem.requestId,
        status: scrapItem.status,
        isVerified: scrapItem.isVerified, // Include the updated isVerified field
      },
      deliveryBoy: {
        _id: deliveryBoy._id,
        name: deliveryBoy.name,
        number: deliveryBoy.number,
        isActive: deliveryBoy.isActive,  // Should remain true
      },
    });
  } catch (error) {
    console.error(error);  // Log any unexpected errors for debugging
    return res.status(500).json({ message: "Internal Server Error", error });
  }
};
exports. assignDeliveryBoyCureent = async (req, res) => {
  const { userId, latitude, longitude } = req.body;

  try {
    // Find the nearest active delivery boy within 5 km (5000 meters)
    const nearestDeliveryBoy = await DeliveryBoy.findOne({
      isActive: true, // Only consider active delivery boys
      status: "current", // Must have current status
      location: {
        $nearSphere: {
          $geometry: { type: "Point", coordinates: [longitude, latitude] }, // User's location
          $maxDistance: 5000 // 5 km in meters
        }
      }
    });

    if (nearestDeliveryBoy) {
      // Mark delivery boy as assigned
      nearestDeliveryBoy.isActive = false; // Mark delivery boy inactive (assigned)
      nearestDeliveryBoy.assignedBy = userId; // Assign the user ID
      await nearestDeliveryBoy.save(); // Save changes to the database

      // Respond with the assigned delivery boy details
      return res.json({
        message: 'Delivery boy assigned successfully',
        deliveryBoy: {
          id: nearestDeliveryBoy._id,
          name: nearestDeliveryBoy.name,
          number: nearestDeliveryBoy.number,
          distance: 'Within 5 km' // Optional: Indicate distance range
        }
      });
    } else {
      // No delivery boy found within 5 km
      return res.status(404).json({ message: 'No delivery boy available within 5 km.' });
    }
  } catch (error) {
    console.error('Error in assignDeliveryBoyCurrent:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

