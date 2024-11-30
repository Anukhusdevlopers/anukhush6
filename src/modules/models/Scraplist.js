// models/ScrapItem.js
const mongoose = require('mongoose');

const ScrapItemSchema = new mongoose.Schema({
  authToken: { type: String, required: true },
  scrapItems: [
    {
      name: { type: String, required: true },
      price: { type: String, required: true },
      weight: { type: Number, required: true }
    }
  ],



  name: { type: String, required: true },
  image: { type: String },
  formimage: { type: String },//add on delivery boy manuaaly added this image 
  pickUpDate: { type: Date, required: true }, // New field for pickup date
  pickUpTime: { type: String, required: true }, // New field for pickup time as string
  location: { type: String, required: true },
  latitude: { type: Number, }, // New field for latitude
  longitude: { type: Number, } , // New field for longitude
  requestId: { type: String, required: true, unique: true }, // Ensure this is included

  
status: {
    type: String,
    enum: ['completed', 'cancelled', 'upcoming', 'inprogress'],
    default: 'upcoming', // or whichever status should be default
  },
  paymentMode: { type: String, required: true }, // New field for payment mode

  // Reference to the AnuUser2 table
  anuUser2: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'AnuUser2', // Refers to the AnuUser2 model
    required: true // Make it required if you always need this reference
  },
  deliveryBoy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DeliveryBoy', // Refers to the DeliveryBoy model
  },
  isVerified: { 
    type: Boolean, 
    default: false, // Default to false unless specified
 
  },
  isAssigned: { 
    type: Boolean, 
    default: false, // Default to false unless specified
  
  },
});

module.exports = mongoose.model('ScrapItem', ScrapItemSchema);
