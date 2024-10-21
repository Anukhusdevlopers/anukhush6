const express = require('express');
const router = express.Router();
const { createFeedback, getAllFeedback } = require('../controllers/ContactController');

// Route to create feedback (POST)
router.post('/contact-us', createFeedback);

// Route to get all feedback (GET)
router.get('/contact-us', getAllFeedback);

module.exports = router;
