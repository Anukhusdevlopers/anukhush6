const ScrapItem = require('../models/Scraplist'); // Adjust the path as needed
const User = require('../models/AnuUser'); // Import the Customer model
const moment = require('moment');
const DeliveryRequest=require("../models/Scraplist")
// Function to handle today-req
exports.getRequestsByNumberAndDate = async (req, res) => {
    try {
        const { date } = req.body;

        // Validate input
        if (!date) {
            return res.status(400).json({
                success: false,
                message: "Please provide a date."
            });
        }

        // Convert date from 'YYYY-MM-DD' to JavaScript Date object
        const formattedDate = moment(date, 'YYYY-MM-DD').startOf('day').toDate();
        const nextDay = moment(formattedDate).add(1, 'days').toDate();

        // Fetch all requests based on the pickUpDate
        const requests = await ScrapItem.find({
            pickUpDate: { $gte: formattedDate, $lt: nextDay }
        });

        // Check if requests are found
        if (requests.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No requests found for this date."
            });
        }

        // Format the response data
        const responseData = requests.map(request => ({
            customerName: request.name,
            pickUpTime: request.pickUpTime,
            address: request.location,
            reqId: request.requestId,
            status: request.status || "unknown", // Fallback for status if not defined
            longitude: request.longitude,
            latitude: request.latitude,
            pickUpDate: moment(request.pickUpDate).format('YYYY-MM-DD') // Format as needed
        }));

        return res.status(200).json({
            success: true,
            data: responseData
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "An error occurred while fetching requests."
        });
    }
};
exports.getRequestsByNumberAndDate1 = async (req, res) => {
    try {
      const { number, pickUpDate, authToken: bodyToken } = req.body;
      let authToken = req.headers.authorization;
  
      // Check if authToken is in the body or headers
      if (authToken) {
        // Remove 'Bearer ' prefix if it's in the headers
        if (authToken.startsWith('Bearer ')) {
          authToken = authToken.slice(7, authToken.length).trim();
        }
      } else if (bodyToken) {
        // If not in the headers, use the token from the body
        authToken = bodyToken;
      } else {
        // If no token is found at all, return unauthorized
        return res.status(401).json({ message: 'Unauthorized, authToken missing' });
      }
  
      // Log the token
      console.log('Received authToken:', authToken);
  
      // Find the user based on the given number
      const user = await User.findOne({ number });
  
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      // Log user details
      console.log('User found:', user);
  
      // Convert the pickUpDate to a Date object
      const startOfDay = new Date(pickUpDate);
      startOfDay.setHours(0, 0, 0, 0); // Set to start of the day
  
      const endOfDay = new Date(pickUpDate);
      endOfDay.setHours(23, 59, 59, 999); // Set to end of the day
  
      // Log the date range
      console.log('Date range:', startOfDay, endOfDay);
  
      // Find all ScrapItems matching the pickUpDate range and authToken
      const scrapItems = await ScrapItem.find({
        pickUpDate: { $gte: startOfDay, $lte: endOfDay },
        authToken: authToken, // Match the processed authToken (from either body or headers)
      });
  
      // Log the scrapItems query result
      console.log('ScrapItem query result:', scrapItems);
  
      // Check if any ScrapItems were found
      if (scrapItems.length === 0) {
        console.log('No ScrapItems found for the given date and token');
        return res.status(404).json({ message: 'No pickups scheduled for this date' });
      }
  
      // Prepare the response for each ScrapItem
      const response = scrapItems.map(scrapItem => ({
        customerName: user.name,
        number: user.number,
        pickUpTime: scrapItem.pickUpTime,
        address: user.address || scrapItem.location,
        requestId: scrapItem.requestId,
        status: 'upcoming',
        latitude: scrapItem.latitude || user.latitude,
        longitude: scrapItem.longitude || user.longitude,
      }));
  
      // Return the response
      return res.status(200).json(response);
    } catch (error) {
      console.error('Error fetching customer details:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  };
  exports.getScrapItemByRequestId = async (req, res) => {
    try {
      // Get the authToken from the headers
      const authToken = req.headers.authToken || req.headers.authorization?.split(" ")[1];
  
      if (!authToken) {
        return res.status(401).json({ message: "Authorization token is required." });
      }
  
      // Get requestId from the request body
      const { requestId } = req.body;
  
      if (!requestId) {
        return res.status(400).json({ message: "requestId is required." });
      }
  
      // Find the ScrapItem by requestId and authToken
      const scrapItem = await ScrapItem.findOne({ requestId, authToken });
  
      if (!scrapItem) {
        return res.status(404).json({ message: "No scrap item found with the provided requestId." });
      }
  
      // Prepare the response including the status
      const response = {
        status: 200,
        data: {
          scrapItem,
          status: scrapItem.status || 'upcoming', // Assuming scrapItem has a 'status' field; default to 'unknown' if not available
        },
        message: "Scrap item fetched successfully.",
      };
  
      // Send the response
      return res.status(200).json(response);
    } catch (error) {
      console.error("Error fetching scrap item:", error);
      return res.status(500).json({
        message: "Error fetching scrap item.",
        error: error.message || "Internal server error",
      });
    }
  };
  //ye api hamare delivery boy jb amnnyaly verify krega data ki whi h ya nhi uske leye h 
  exports.updateDeliveryRequest = async (req, res) => {
    try {
        // Get the authToken from the headers
        const authToken = req.headers.authToken || req.headers.authorization?.split(" ")[1];

        if (!authToken) {
            return res.status(401).json({ message: "Authorization token is required." });
        }

        // Get the requestId from the body
        const { requestId, number, name, scrapItems, deliveryBoyName, paymentAccepted } = req.body;

        // Check if requestId is provided
        if (!requestId) {
            return res.status(400).json({ message: "Request ID is required." });
        }

        // Parse scrapItems if it's a string
        let parsedScrapList;
        try {
            parsedScrapList = JSON.parse(scrapItems);
        } catch (error) {
            return res.status(400).json({ message: "Invalid scrapList format." });
        }

        // Update the delivery request
        const updateData = {
            number,
            name,
            scrapItems: parsedScrapList,
            deliveryBoyName,
            paymentAccepted,
            formimage: req.file ? req.file.path : null // Use the new image path if uploaded
        };

        // Find the delivery request by requestId and update it
        const updatedRequest = await DeliveryRequest.findOneAndUpdate(
            { requestId }, // Filter by requestId
            { $set: updateData }, // Update the fields
            { new: true } // Return the updated document
        );

        if (!updatedRequest) {
            return res.status(404).json({ message: "Delivery request not found." });
        }

        // Prepare the response data with default deliveryBoyName, paymentAccepted, and completed status
        const responseData = {
            deliveryRequest: updatedRequest,
            deliveryBoyName: deliveryBoyName || "Default Delivery Boy", // Set default name if not provided
            paymentAccepted: paymentAccepted !== undefined ? paymentAccepted : false, // Default to false if not provided
            number: number || "Not Provided", // Set default number if not provided
            status: "completed" // Add the status field as completed
        };

        // Send back a success response
        res.status(200).json({
            status: 200,
            data: responseData, // Wrap the updated delivery request and default values in the data object
            message: 'Delivery request updated successfully.'
        });
    } catch (error) {
        console.error("Error updating delivery request:", error);
        res.status(500).json({
            message: 'Error updating delivery request.',
            error: error.message || 'Internal server error',
        });
    }
};


