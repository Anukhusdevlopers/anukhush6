const DeliveryBoy = require('../models/DeliveryBoyNew');
const jwt = require('jsonwebtoken');

// Assign Delivery Boy by Wholesaler
// Assign Delivery Boy by Wholesaler
exports.assignDeliveryBoy = async (req, res) => {
    const { name, address, email, aadharNo, panNo, vehicleType, licenseNo, phoneNumber, assignedBy } = req.body;
  
    try {
      const deliveryBoy = new DeliveryBoy({
        name,
        address,
        email,
        aadharNo,
        panNo,
        vehicleType,
        licenseNo,
        phoneNumber,
        assignedBy
      });
  
      await deliveryBoy.save();
  
      // Generate JWT Token
      const token = jwt.sign({ id: deliveryBoy._id, role: 'wholesaler' }, 'your_secret_key', { expiresIn: '1h' });
  
      res.status(201).json({ 
        message: "Delivery Boy assigned successfully", 
        deliveryBoy,
        token // Include the token in the response
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
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
