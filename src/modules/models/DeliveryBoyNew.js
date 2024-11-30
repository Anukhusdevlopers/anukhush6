const mongoose = require('mongoose');

const deliveryBoySchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: {     type: [String], // Change this to an array of strings
     required: true },
  email: { type: String, required: true, unique: true },
  aadharNo: { type: String, required: true, unique: true },
  panNo: { type: String, required: true },
  vehicleType: { type: String, required: true },
  licenseNo: { type: String, required: true },
  number: { type: String, required: true,unique: true },
  status: { type: String, required: true, default: 'current' }, // Default to 'current'
  location: { type: String, required: true } , // Add the location field here

  isActive: {
    type: Boolean,
    default: false, // By default, a new delivery boy is active
  },
  
  otp: { type: String }, // Add this field for storing OTP

  assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Wholesaler' }, // Reference to Wholesaler
}, { timestamps: true });

const DeliveryBoy = mongoose.model('DeliveryBoy', deliveryBoySchema);

module.exports = DeliveryBoy;
