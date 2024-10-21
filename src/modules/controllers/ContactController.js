const Feedback = require('../models/ContactUs');

// Create Feedback
const createFeedback = async (req, res) => {
  try {
    const { name, email, phoneNumber, message, rating, reasonForRating, updateFromUs } = req.body;

    // Validate required fields
    if (!name || !email || !phoneNumber || !message ) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    // Create a new feedback entry
    const newFeedback = new Feedback({
      name,
      email,
      phoneNumber,
      message,
      rating,
      reasonForRating,
      updateFromUs
    });

    // Save to database
    await newFeedback.save();

    res.status(201).json({
      message: 'Contact us  submitted successfully',
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
