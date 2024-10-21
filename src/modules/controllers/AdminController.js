const Admin = require('../models/Admin');
const bcrypt = require('bcryptjs');

// Register Admin
exports.registerAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Create a new admin instance
    const newAdmin = new Admin({
      name,
      email,
      password, // Make sure to hash the password before saving
    });

    // Save the admin to the database
    const savedAdmin = await newAdmin.save();

    // Send back the saved admin data (including _id)
    res.status(201).json({
      _id: savedAdmin._id,   // Send the _id back to the client
      name: savedAdmin.name,
      email: savedAdmin.email,
      message: 'Admin registered successfully',
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Login Admin
exports.loginAdmin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const admin = await Admin.findOne({ email });

    if (!admin) {
      return res.status(404).json({ error: "Admin not found" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    res.status(200).json({ message: "Login successful", admin });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
// Function to get all admins
exports.getAllAdmins = async (req, res) => {
  try {
      const admins = await Admin.find(); // Fetch all admin records
      res.status(200).json(admins);
  } catch (error) {
      res.status(500).json({ message: 'Error fetching admin data', error });
  }
};
