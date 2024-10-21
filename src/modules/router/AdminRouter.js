const express = require('express');
const router = express.Router();
const { registerAdmin, loginAdmin ,getAllAdmins} = require('../controllers/AdminController');

// Register new admin
router.post('/register', registerAdmin);

// Admin login
router.post('/login', loginAdmin);
router.get('/admins', getAllAdmins);

module.exports = router;
