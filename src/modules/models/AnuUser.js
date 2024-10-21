const mongoose = require('mongoose');

// Check if the model already exists before defining it
const User = mongoose.models.AnuUser || mongoose.model('AnuUser2', new mongoose.Schema({
    number: {
        type: String,
        required: true,
        unique: true
    },
    role: {
        type: String,
        enum: ['retailer', 'corporate','wholesaler','deliveryAgent'],
        required: true
    },
    name: {
        type: String,
        required: function () { return this.role === 'customer'; }
    },
    address: {
        type: String, // Make it optional
    },
    otp: {
        type: String,
    },
    otpExpires: {
        type: Date, // Expiration time for OTP
    },
    latitude: {
        type: String, // Expiration time for OTP
    },
    longitude: {
        type: String, // Expiration time for OTP
    },
    verified: {
        type: Boolean,
        default: false,
    }
}));

module.exports = User;
