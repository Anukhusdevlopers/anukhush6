const mongoose = require('mongoose');

const deliverySchema = new mongoose.Schema({
  deliveryBoyId: { type: String, required: true },
  orderId: { type: String, required: true, unique: true },
  location: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true }
  },
  status: { type: String, default: 'pending' }
}, { timestamps: true });

module.exports = mongoose.model('Delivery', deliverySchema);
