const express = require('express');
const router = express.Router();
const { assignWholesaler, getWholesalersByAdmin,WholesalerLogin, verifyOTP,deactivateWholeseler,getTodaysWholesalers} = require('../controllers/WholeselereController');



const { assignDeliveryBoy, getDeliveryBoysByWholesaler,deliveryboyLogin,verifyOTPDeliveryboy , updateDeliveryBoyAddress,deactivateDeliveryBoy,getDeliveryBoysByWholesalerId} = require('../controllers/DeliveryboyController');

// Assign a Delivery Boy by Wholesaler
router.post('/delivery/assign', assignDeliveryBoy);
// Route to log in and send OTP to the wholesaler's number
router.post('/wholesaler/login', WholesalerLogin);
router.get('/wholesalers/today', getTodaysWholesalers);
router.put('/deliveryboy/edit-address/:id', updateDeliveryBoyAddress);

// Route to verify the OTP
router.post('/wholesaler/verify-otp', verifyOTP);
router.post('/deliveryboy/login', deliveryboyLogin);
router.get('/delivery-boy-bywholeselerid/:id', getDeliveryBoysByWholesalerId);
router.patch('/deliveryboy/deactivate/:id', deactivateDeliveryBoy);
router.patch('/wholeseler/deactivate/:id', deactivateWholeseler);
// Route to verify the OTP
router.post('/deliveryboy/verify-otp', verifyOTPDeliveryboy);
// Get all Delivery Boys assigned by Wholesaler
router.get('/deliveryboys', getDeliveryBoysByWholesaler);
// Assign a wholesaler by Admin
router.post('/assign', assignWholesaler);

// Get all wholesalers assigned by Admin
router.get('/wholesalers', getWholesalersByAdmin);

module.exports = router;
