const express = require('express');
const router = express.Router();
const userController = require('../controllers/AnuUserController'); // Correct path to the controller
const authtoken=require('../middleware/authMiddleware')
// POST /register - User registration route
router.post('/kawadiwala/register', userController.registerUser);

router.get('/kawadiwala/register', userController.getAllUsers);
router.post('/kawadiwala/login', userController.loginUser);

router.post('/kawadiwala/ratelist', userController.createRateList);
router.get('/kawadiwala/ratelist', userController.getAllRateLists);
router.post('/send-message',userController.sendOtp1)
router.post('/kawadiwala/send-otp', userController.sendOtp);
router.post('/kawadiwala/verify-otp', userController.verifyOtp);
router.post('/kawadiwala/resend-otp', userController.resendOtp);
router.put('/edit-profile', userController. editProfile); // Add middleware for authentication

router.get('/kawadiwala/ratelist/:slug',userController. getRateListBySlug);

module.exports = router;
