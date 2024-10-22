const Feedback = require('../models/ContactUs');

// Create Feedback
const createFeedback = async (req, res) => {
  try {
    const { name, email, phoneNumber, message, rating, reasonForRating, updateFromUs } = req.body;

    // Validate required fields
    if (!name || !email || !phoneNumber || !message) {
      return res.status(400).json({ message: 'All required fields must be provided.' });
    }

    // Create a new feedback entry with optional fields
    const newFeedback = new Feedback({
      name,
      email,
      phoneNumber,
      message,
      rating: rating || null, // Optional field, defaults to null if not provided
      reasonForRating: reasonForRating || '', // Optional field, defaults to empty string if not provided
      updateFromUs: updateFromUs || false, // Optional field, defaults to false if not provided
    });

    // Save to database
    await newFeedback.save();

    res.status(201).json({
      message: 'Contact us submitted successfully',
      data: newFeedback,
    });
  } catch (error) {
    console.error('Error creating feedback:', error);
    res.status(500).json({
      message: 'Error creating feedback',
      error: error.message,
    });
  }
};


// Get All Feedback
const getAllFeedback = async (req, res) => {
  try {
    // Fetch all feedback from the database
    const feedbacks = await Feedback.find({});

    if (!feedbacks || feedbacks.length === 0) {
      return res.status(404).json({ message: 'No Contact found.' });
    }

    res.status(200).json({
      message: 'Contact all Contact successfully',
      data: feedbacks,
    });
  } catch (error) {
    console.error('Error fetching Contact:', error);
    res.status(500).json({
      message: 'Error fetching Contact',
      error: error.message,
    });
  }
};

module.exports = { createFeedback, getAllFeedback };
