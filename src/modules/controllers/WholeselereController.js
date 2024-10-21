const Wholesaler = require('../models/WholeSeler');
const jwt = require('jsonwebtoken');

// Assign Wholesaler by Admin
// Assign Wholesaler by Admin
exports.assignWholesaler = async (req, res) => {
  const { name, address, email, aadharNo, panNo, turnover, phoneNumber, assignedBy } = req.body;

  try {
    // Create a new wholesaler instance
    const wholesaler = new Wholesaler({
      name,
      address,
      email,
      aadharNo,
      panNo,
      turnover,
      phoneNumber,
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

// Get all Wholesalers assigned by an Admin
exports.getWholesalersByAdmin = async (req, res) => {
  
    try {
      const wholesalers = await Wholesaler.find(); // Fetch all wholesalers
      res.status(200).json({ wholesalers });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }

};
