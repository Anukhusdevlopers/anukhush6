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
  assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Wholesaler' }, // Reference to Wholesaler
}, { timestamps: true });

const DeliveryBoy = mongoose.model('DeliveryBoy', deliveryBoySchema);

module.exports = DeliveryBoy;
