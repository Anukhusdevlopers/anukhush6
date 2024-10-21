// models/RateList.js
const mongoose = require('mongoose');

const rateListSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    price: {
        type: String,
        required: true
    },
    OnlyPrice: {
        type: Number,
        required: true
    },
    slug: {
        type: String,
        
        unique: true
    }
}, { timestamps: true });

const RateList = mongoose.model('RateList', rateListSchema);

module.exports = RateList;
