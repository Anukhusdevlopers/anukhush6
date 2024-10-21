// src/routes/messageRoutes.js
const express = require('express');
const sendMessage  = require('../controllers/whatsaap');
const delivery=require("../controllers/deliveryboyreqcontroller");
const upload=require('../image-file/index');
const router = express.Router();

// Define the route for sending messages
router.post('/send-message/api',sendMessage. sendMessage);
router.post('/verify-otp/api',sendMessage.verifyOTP);
router.post('/resend-otp/api', sendMessage.resendOTP); // Add this line
router.post('/login/api',sendMessage.loginUser);
router.delete('/cutomer/:userId',sendMessage. deleteUser); // Adjust the URL path as needed

router.post('/today-req', delivery.getRequestsByNumberAndDate);
router.post('/single-request-id', delivery.getScrapItemByRequestId);
router.put('/form-submit-data', upload.single('formimage'),delivery. updateDeliveryRequest); // Use 'upload.single' for single file upload

router.post('/today-req-time', delivery.getRequestsByNumberAndDate1);
router.put('/edit-profile/api',sendMessage. editProfile);

router.get('/user-profile',sendMessage. getProfile); // GET request to get profile details
router.put('/update-address', sendMessage. updateAddress);

module.exports = router;
