const mongoose = require('mongoose');

const deliveryFormSchema = new mongoose.Schema({
  requestId: {
    type: String,
    ref: 'ScrapItem',
    required: true,
    unique: true
  },
  imageName: { type: String, required: false }, // New field for storing image name

  scrapItems: [
    {
      name: { type: String, required: true },
      price: { type: Number, required: true },
      weight: { type: String, required: true }
    }
  ],
  scrapSold: { type: Boolean, required: true }, // true -> Completed, false -> Rejected
  reason: { type: String },
  deliveryBoyName: { type: String }, // Populated from Request
  paymentAccepted: { type: String }, // Populated from Request
  totalPrice: { type: Number, required: true },
  status: { type: String,  },// Populated from Request
  isActive: { type: Boolean, default: false }
}, { timestamps: true });

const DeliveryForm = mongoose.model('DeliveryForm', deliveryFormSchema);

module.exports = DeliveryForm;
