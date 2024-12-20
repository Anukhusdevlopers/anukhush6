const mongoose = require('mongoose');

const wholesalerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  aadharNo: { type: String, required: true, unique: true },
  panNo: { type: String, required: true, unique: true },
  turnover: { type: Number, required: true },
  number: { type: String, required: true },
  deliveryBoys: [{ type: mongoose.Schema.Types.ObjectId, ref: 'DeliveryBoy' }],
  role: {
    type: String,
    enum: ['junkyard', 'dumpingYard'],
    required: true
},
  isActive: {
    type: Boolean,
    default: true, // By default, a new delivery boy is active
  },
  assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' }, // Reference to Admin
}, { timestamps: true });

const Wholesaler = mongoose.model('Wholesaler', wholesalerSchema);

module.exports = Wholesaler;
