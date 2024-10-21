// models/Otp.js
const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
    phoneNumber: {
        type: String,
        required: true,
        unique: true,
    },
    otp: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        index: { expires: 300 } // OTP expires in 5 minutes (300 seconds)
    },
    verified: {
        type: Boolean,
        default: false,
    }
});

module.exports = mongoose.model('Otp', otpSchema);
