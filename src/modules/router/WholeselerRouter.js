const express = require('express');
const router = express.Router();
const { assignWholesaler, getWholesalersByAdmin,WholesalerLogin, verifyOTP} = require('../controllers/WholeselereController');



const { assignDeliveryBoy, getDeliveryBoysByWholesaler,deliveryboyLogin,verifyOTPDeliveryboy } = require('../controllers/DeliveryboyController');

// Assign a Delivery Boy by Wholesaler
router.post('/delivery/assign', assignDeliveryBoy);
// Route to log in and send OTP to the wholesaler's number
router.post('/wholesaler/login', WholesalerLogin);

// Route to verify the OTP
router.post('/wholesaler/verify-otp', verifyOTP);
router.post('/deliveryboy/login', deliveryboyLogin);

// Route to verify the OTP
router.post('/deliveryboy/verify-otp', verifyOTPDeliveryboy);
// Get all Delivery Boys assigned by Wholesaler
router.get('/deliveryboys', getDeliveryBoysByWholesaler);
// Assign a wholesaler by Admin
router.post('/assign', assignWholesaler);

// Get all wholesalers assigned by Admin
router.get('/wholesalers', getWholesalersByAdmin);

module.exports = router;
