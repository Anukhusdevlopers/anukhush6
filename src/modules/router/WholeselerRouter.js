const express = require('express');
const router = express.Router();
const { assignWholesaler, getWholesalersByAdmin,WholesalerLogin, verifyOTP,deactivateWholeseler,getwholeselerById,getProfileWholeseler,getTodaysWholesalers} = require('../controllers/WholeselereController');



const { assignDeliveryBoy, getDeliveryBoysByWholesaler,deliveryboyLogin,verifyOTPDeliveryboy ,getProfileDeliveryBoy,getRequestsByStatus, updateDeliveryBoyAddress,deactivateDeliveryBoy,getDeliveryBoysByWholesalerId} = require('../controllers/DeliveryboyController');

// Assign a Delivery Boy by Wholesaler
router.post('/delivery/assign', assignDeliveryBoy);
// Route to log in and send OTP to the wholesaler's number
router.post('/wholesaler/login', WholesalerLogin);
router.get('/wholesalers/today', getTodaysWholesalers);
router.put('/deliveryboy/edit-address/:id', updateDeliveryBoyAddress);
router.get('/wholeseler-byadminid/:id', getwholeselerById);
router.get('/user-profile-whole-seller',  getProfileWholeseler);
// Route to verify the OTP
router.post('/wholesaler/verify-otp', verifyOTP);
router.post('/deliveryboy/login', deliveryboyLogin);
router.post('/delivery-boy-status', getRequestsByStatus);

router.get('/deactivate-deliveryboy-by-Id/:id', getDeliveryBoysByWholesalerId);
router.get('/user-profile-delivery-boy',  getProfileDeliveryBoy);

router.patch('/deliveryboy/deactivate/:id', deactivateDeliveryBoy);
router.patch('/wholeseler/deactivate/:id', deactivateWholeseler);
// Route to verify the OTP
router.post('/deliveryboy/verify-otp', verifyOTPDeliveryboy);
// Get all Delivery Boys assigned by Wholesaler
router.get('/deliveryboys/wholesalerId/:wholesalerId', getDeliveryBoysByWholesaler);
// Assign a wholesaler by Admin
router.post('/assign', assignWholesaler);

// Get all wholesalers assigned by Admin
router.get('/wholesalers', getWholesalersByAdmin);

module.exports = router;
