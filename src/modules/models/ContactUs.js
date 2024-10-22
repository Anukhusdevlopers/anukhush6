const mongoose = require('mongoose');

// Define the Feedback schema
const feedbackSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  phoneNumber: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  rating: {
    type: Number,
    required: false, // Optional
    min: 1,
    max: 5, // Rating between 1 and 5
  },
  reasonForRating: {
    type: String,
    required: false, // Optional
  },
  updateFromUs: {
    type: Boolean, // Boolean type instead of String
    required: false, // Optional
    default: false, // Defaults to false
  },
}, {
  timestamps: true, // Automatically adds createdAt and updatedAt
});

module.exports = mongoose.model('ContactUs', feedbackSchema); // Fix the typo
