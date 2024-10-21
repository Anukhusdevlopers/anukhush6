const express = require('express');
const router = express.Router();
const deliveryController = require('../controllers/otpcontroller');

router.post('/create', deliveryController.createDelivery);
router.post('/update', deliveryController.updateDelivery);
router.get('/:orderId', deliveryController.getDelivery);

module.exports = router;
