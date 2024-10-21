const express = require('express');
const router = express.Router();
const { assignWholesaler, getWholesalersByAdmin } = require('../controllers/WholeselereController');



const { assignDeliveryBoy, getDeliveryBoysByWholesaler } = require('../controllers/DeliveryboyController');

// Assign a Delivery Boy by Wholesaler
router.post('/delivery/assign', assignDeliveryBoy);

// Get all Delivery Boys assigned by Wholesaler
router.get('/deliveryboys', getDeliveryBoysByWholesaler);
// Assign a wholesaler by Admin
router.post('/assign', assignWholesaler);

// Get all wholesalers assigned by Admin
router.get('/wholesalers', getWholesalersByAdmin);

module.exports = router;
