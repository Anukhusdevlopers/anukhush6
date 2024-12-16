// controllers/scrapItemController.js
const ScrapItem = require('../models/Scraplist'); // Ensure the correct model name
const User=require('../models/AnuUser');
const DeliveryBoy=require('../models/DeliveryBoyNew')
// Create Scrap Item
const { v4: uuidv4 } = require('uuid'); // Import the uuid library

// controllers/scrapItemController.js
const createScrapItem = async (req, res) => {
  try {
    console.log("Authorization Header:", req.headers.authorization);

    const authToken = req.headers.authToken || req.headers.authorization?.split(" ")[1];
    if (!authToken) {
      return res.status(401).json({ message: "Authorization token is required." });
    }

    const {
      scrapItems,
      name,
      pickUpDate,
      pickUpTime,
      latitude,
      location,
      longitude,
      anuUser2Id, // Reference to the user creating this request
      paymentMode,
      isVerified = false,
      isAssigned = false,
      isInstantPickUp = false,
    } = req.body;

    let parsedScrapItems;
    try {
      parsedScrapItems = JSON.parse(scrapItems);
    } catch (err) {
      return res.status(400).json({ message: "Invalid scrapItems format", error: err.message });
    }

    const currentDate = new Date();
    const day = String(currentDate.getDate()).padStart(2, "0");
    const month = String(currentDate.getMonth() + 1).padStart(2, "0");
    const year = String(currentDate.getFullYear()).slice(-2);

    const requestNumber = (await ScrapItem.find({})).length + 1;
    const requestId = `${day}${month}${year}${requestNumber}`;

    const newScrapItem = new ScrapItem({
      authToken,
      scrapItems: parsedScrapItems,
      name,
      image: req.file ? req.file.path : null,
      pickUpDate,
      pickUpTime,
      location,
      latitude: parseFloat(latitude) || null,
      longitude: parseFloat(longitude) || null,
      requestId,
      anuUser2: anuUser2Id,
      paymentMode,
      isVerified,
      isAssigned,
      isInstantPickUp,
    });

    // **Instant Pickup Logic**
    if (isInstantPickUp && latitude && longitude) {
      const deliveryBoys = await DeliveryBoy.find({
        location: {
          $nearSphere: {
            $geometry: {
              type: "Point",
              coordinates: [longitude, latitude],
            },
            $maxDistance: 5000,
          },
        },
      }).select("name number location requests");

      if (deliveryBoys.length > 0) {
        const assignedDeliveryBoy = deliveryBoys[0];

        // Assign delivery boy details
        newScrapItem.isAssigned = true;
        newScrapItem.deliveryBoy = assignedDeliveryBoy._id; // Set delivery boy reference



        // Add the delivery boy details to the ScrapItem document
        newScrapItem.deliveryBoyDetails = {
          name: assignedDeliveryBoy.name,
          number: assignedDeliveryBoy.number,
        };
        // Update the delivery boy's requests field
        const requestDetails = {
          user: anuUser2Id, // Reference to the user who created the request
          requestId: newScrapItem._id, // Reference to the ScrapItem ID
          time: Date.now(),
        };

        await DeliveryBoy.findByIdAndUpdate(
          assignedDeliveryBoy._id,
          { $push: { requests: requestDetails } }, // Add the userId and ScrapItem ID to requests
          { new: true }
        );

        // Save the scrap item with assigned delivery boy
        await newScrapItem.save();

        return res.status(200).json({
          status: 200,
          data: {
            requestId: newScrapItem.requestId,
            deliveryBoy: {
              id: assignedDeliveryBoy._id,
              name: assignedDeliveryBoy.name || null,
              number: assignedDeliveryBoy.number || null,
            },
          },
          message: "Request created and delivery boy assigned.",
        });
      } else {
        return res.status(200).json({
          status: 200,
          data: {
            requestId: newScrapItem.requestId,
            deliveryBoy: null,
          },
          message: "Request created, but no delivery boys found within 5 km range.",
        });
      }
    }

    // Save the new scrap item if no delivery boy was assigned
    await newScrapItem.save();

    res.status(200).json({
      status: 200,
      data: { requestId: newScrapItem.requestId },
      message: "Request created successfully",
    });
  } catch (error) {
    console.error("Error creating scrap item:", error);
    res.status(500).json({
      message: "Error creating scrap item",
      error: error.message || "Internal server error",
    });
  }
};



// Controller to fetch all scrap requests based on authToken and role
// Fetch requests based on authToken from headers
const getRequestsByAuthTokenAndRole = async (req, res) => {
  try {
    console.log('Request Params:', req.params); // Log the entire params object
    console.log('Request Body:', req.body); // Log the body

    // Extract userId from either the body or the URL parameters
    const userId = req.params.userId || req.body.userId;

    console.log('Received User ID:', userId); // Debugging - Check if 'userId' is being passed correctly

    if (!userId) {
      return res.status(400).json({
        message: 'User ID (anuUser2) must be provided in the URL or body.',
      });
    }

    // Pagination parameters (with default values)
    const page = parseInt(req.query.page) || 1; // Current page number, default is 1
    const limit = parseInt(req.query.limit) || 10; // Items per page, default is 10
    const skip = (page - 1) * limit;

    // Fetch the scrap items associated with the given userId, sorted by the most recent (descending)
    const scrapRequests = await ScrapItem.find({ anuUser2: userId })
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }); // Sort by 'createdAt' in descending order (newest first)

    // Count total documents for this query
    const totalDocuments = await ScrapItem.countDocuments({ anuUser2: userId });
    const totalPages = Math.ceil(totalDocuments / limit);

    if (!scrapRequests || scrapRequests.length === 0) {
      return res.status(404).json({
        message: 'No requests found for the provided user ID.',
      });
    }

    // Process each request to add both customer and delivery boy details
    const updatedRequests = await Promise.all(scrapRequests.map(async (request) => {
      // Adding customer details under 'customerDetails' key
      const customerDetails = {
        name: request.name,
        number: request.number,
        location: request.location,
        pickUpDate: request.pickUpDate,
        pickUpTime: request.pickUpTime,
        status: request.status,
        paymentMode: request.paymentMode,
        isInstantPickUp: request.isInstantPickUp,
        latitude: request.latitude,
        longitude: request.longitude,
        requestId: request.requestId,
      };

      request.customerDetails = customerDetails;

      // If there is a delivery boy assigned, fetch the delivery boy's details
      if (request.deliveryBoy) {
        const deliveryBoy = await DeliveryBoy.findById(request.deliveryBoy);

        if (deliveryBoy) {
          // Add delivery boy's details under 'deliveryBoyDetails'
          request.deliveryBoyDetails = {
            name: deliveryBoy.name,
            number: deliveryBoy.number,
            isVerified: deliveryBoy.isVerified,
            isAssigned: deliveryBoy.isAssigned,
          };
        }
      }

      // Return updated request
      return request;
    }));

    // Send response with both customer and delivery boy details
    res.status(200).json({
      message: 'Fetched all requests successfully.',
      data: updatedRequests,
      pagination: {
        totalDocuments,
        totalPages,
        currentPage: page,
        pageSize: updatedRequests.length,
      },
    });
  } catch (error) {
    console.error('Error fetching requests by user ID:', error);
    res.status(500).json({
      message: 'Error fetching requests',
      error: error.message,
    });
  }
};


  // Controller to fetch a single scrap request by request ID
  // Controller to fetch a single scrap request by request ID
  const getRequestById = async (req, res) => {
    try {
        const { requestId } = req.params; // Extract requestId from route parameters
        console.log("Received requestId:", requestId); // Log the received requestId

        // Validate the requestId format
        if (!requestId) {
            return res.status(400).json({
                message: 'Request ID must be provided.',
            });
        }

        // Fetch the scrap request by its _id (or appropriate identifier)
        const scrapRequest = await ScrapItem.findById("66f988e33d584b3431f81af9"); // Use actual ID of ScrapItem here

        if (!scrapRequest || !scrapRequest.scrapItems) {
            console.log("No scrap requests found or scrapItems array is empty.");
            return res.status(404).json({
                message: 'No requests found.',
            });
        }

        // Find the specific scrap item by requestId within the scrapItems array
        const foundItem = scrapRequest.scrapItems.find(item => item.requestId === requestId); // Change _id to requestId

        if (!foundItem) {
            console.log("No scrap item found with the requestId:", requestId);
            return res.status(404).json({
                message: 'No request found with the provided request ID.',
            });
        }

        // Exclude authToken from the response (if needed)
        const { authToken, ...rest } = foundItem.toObject();

        res.status(200).json({
            message: 'Fetched request successfully.',
            data: { requestId, ...rest },
        });
    } catch (error) {
        console.error('Error fetching request by ID:', error);
        res.status(500).json({
            message: 'Error fetching request',
            error: error.message,
        });
    }
};

  
// Controller to fetch all scrap requests for all users
const getAllScrapRequests = async (req, res) => {
  try {
    console.log('Fetching all scrap requests');

    // Fetch all scrap requests from the database
    const allScrapRequests = await User.find({});

    if (!allScrapRequests || allScrapRequests.length === 0) {
      return res.status(404).json({
        message: 'No scrap requests found.',
      });
    }

    res.status(200).json({
      message: 'Fetched all scrap requests successfully.',
      data: allScrapRequests,
    });
  } catch (error) {
    console.error('Error fetching all scrap requests:', error);
    res.status(500).json({
      message: 'Error fetching all scrap requests',
      error: error.message,
    });
  }
};
const getAllScrap = async (req, res) => {
  try {
    console.log('Fetching all scrap requests');

    // Fetch all scrap requests from the database
    const allScrapRequests = await ScrapItem.find({});

    if (!allScrapRequests || allScrapRequests.length === 0) {
      return res.status(404).json({
        message: 'No scrap requests found.',
      });
    }

    res.status(200).json({
      message: 'Fetched all scrap requests successfully.',
      data: allScrapRequests,
    });
  } catch (error) {
    console.error('Error fetching all scrap requests:', error);
    res.status(500).json({
      message: 'Error fetching all scrap requests',
      error: error.message,
    });
  }
};
const cancelScrapItem = async (req, res) => {
  try {
    const { id } = req.params;
    const scrapItem = await ScrapItem.findById(id);

    if (!scrapItem) {
      return res.status(404).json({ message: 'Scrap item not found.' });
    }

    scrapItem.status = 'cancelled'; 
    await scrapItem.save();

    res.status(200).json({
      status: 200,
      message: 'Scrap item request cancelled successfully.',
      data: { requestId: scrapItem.requestId },
    });
  } catch (error) {
    console.error("Error canceling scrap item:", error);
    res.status(500).json({
      message: 'Error canceling scrap item',
      error: error.message || 'Internal server error',
    });
  }
};

// API to fetch unassigned requests
const getUnassignedRequests = async (req, res) => {
  try {
    const unassignedRequests = await ScrapItem.find({ isAssigned: false });
    const count = unassignedRequests.length;

    res.status(200).json({
      success: true,
      message: `Total unassigned requests: ${count}`, // Add backticks here for string interpolation

      data: unassignedRequests,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching unassigned requests',
      error: error.message,
    });
  }
};



  // Get Requests by Status
 
  

module.exports = { createScrapItem ,getUnassignedRequests,getRequestsByAuthTokenAndRole,getRequestById,getAllScrapRequests,getAllScrap,cancelScrapItem};