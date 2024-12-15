const express = require('express');
const router = express.Router();
const { assignWholesaler, getWholesalersByAdmin,WholesalerLogin, verifyOTP,deactivateWholeseler,getwholeselerById,getProfileWholeseler,getTodaysWholesalers} = require('../controllers/WholeselereController');



const { assignDeliveryBoy, getDeliveryBoysByWholesaler,deliveryboyLogin,getAllDeliveryBoysall,assignDeliveryBoyCureent,startDelivery,verifyOTPDeliveryboy ,verifyDeliveryOtp,getAllDeliveryBoys,getProfileDeliveryBoy,getRequestsByStatus, updateDeliveryBoyAddress,deactivateDeliveryBoy,getDeliveryBoysByWholesalerId,getTodayRequests} = require('../controllers/DeliveryboyController');
const { instantPickupController} = require('../controllers/InstantPickup');
router.post('/assign-current-location', assignDeliveryBoyCureent)
router.get('/all-delivery-boy',getAllDeliveryBoysall);

router.get('/deliveryBoy//today-requests/:deliveryBoyId', getTodayRequests);

// Route for handling instant pickup requests via HTTP
router.post('/instant-picup', (req, res) => {
    const data = req.body;

    // Use the controller to process the request
    instantPickupController(null, data);

    // Send response
    res.status(200).json({ message: 'Pickup request processed successfully!' });
});
router.get('/all-delivery-boys',getAllDeliveryBoys);
router.post('/startDelivery', startDelivery);
router.post('/verify-delivery-otp', verifyDeliveryOtp);

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
