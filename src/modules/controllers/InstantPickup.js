const DeliveryBoy = require('../models/DeliveryBoyNew'); // Assuming DeliveryBoy model is in models/DeliveryBoy
const ScrapItem = require('../models/Scraplist'); // Assuming ScrapItem model is in models/ScrapItem

// Haversine formula to calculate distance between two lat-lng points (in kilometers)
const haversine = (lat1, lon1, lat2, lon2) => {
  if (isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)) {
    throw new Error("Invalid latitude or longitude values");
  }
  
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
};

const instantPickupController = async (req, res) => {
  try {
    const { requestId, latitude, longitude } = req.body;

    // Check for missing fields in the request body
    if (!requestId || !latitude || !longitude) {
      return res.status(400).json({ message: "Missing required fields: requestId, latitude, or longitude" });
    }

    console.log(`Received Request: requestId=${requestId}, latitude=${latitude}, longitude=${longitude}`);

    // Find all delivery boys
    const deliveryBoys = await DeliveryBoy.find();

    // If no delivery boys are found, return an error
    if (!deliveryBoys || deliveryBoys.length === 0) {
      return res.status(404).json({ message: "No delivery boys found" });
    }

    // Filter delivery boys within 5 km range
    const nearbyDeliveryBoys = deliveryBoys.filter(boy => {
      const distance = haversine(latitude, longitude, boy.latitude, boy.longitude);
      console.log(`Checking delivery boy ${boy._id}: Distance = ${distance} km`);
      return distance <= 5; // 5 km range
    });

    // If no delivery boys are found within the 5 km range, return an error
    if (nearbyDeliveryBoys.length === 0) {
      return res.status(404).json({ message: "No delivery boys available within 5 km range" });
    }

    // Assign the nearest delivery boy (first one in the filtered list)
    const nearestDeliveryBoy = nearbyDeliveryBoys[0];

    console.log(`Nearest Delivery Boy: ${nearestDeliveryBoy._id}`);

    // Create a new ScrapItem and assign the nearest delivery boy
    const scrapItem = new ScrapItem({
      ...req.body,
      status: 'inprogress', // Set status to inprogress
      deliveryBoy: nearestDeliveryBoy._id, // Assign the nearest delivery boy
    });

    // Save the ScrapItem in the database
    await scrapItem.save();

    // Respond with success and delivery boy info
    res.status(200).json({
      message: 'Instant pickup request processed successfully',
      scrapItem,
      deliveryBoy: nearestDeliveryBoy, // Send details of the nearest delivery boy
    });

  } catch (error) {
    console.error('Error in instantPickupController:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

module.exports = { instantPickupController };
