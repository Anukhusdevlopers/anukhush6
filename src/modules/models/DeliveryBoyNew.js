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
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' }, // GeoJSON type
    coordinates: { type: [Number], required: true } // [longitude, latitude]
  },
  addressdelboy:{
        type: String, required: true  
  },
  isActive: {
    type: Boolean,
    default: false, // By default, a new delivery boy is active
  },
 requests: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'AnuUser2' }, // Reference to User model

      requestId: { type: mongoose.Schema.Types.ObjectId, ref: 'ScrapItem' }, // Request model ka reference
      time: { type: Date, default: Date.now },
    },
  ],
role: {
    type: String,
    required: true,
    default: "deliveryAgent"
  },
  otp: { type: String }, // Add this field for storing OTP

  assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Wholesaler' }, // Reference to Wholesaler
}, { timestamps: true });
// Create the geospatial index for 'location' after the model is initialized
const DeliveryBoy = mongoose.model('DeliveryBoy', deliveryBoySchema);
DeliveryBoy.createIndexes()
  .then(() => console.log('Index created for location field'))
  .catch(err => console.error('Error creating index:', err));
//const DeliveryBoy = mongoose.model('DeliveryBoy', deliveryBoySchema);

module.exports = DeliveryBoy;
