// models/Scrap.js
const mongoose = require('mongoose');

const typeSchema = new mongoose.Schema({
    id: { type: Number, required: true },
    name: { type: String, required: true },
    isSelected: { type: Boolean, default: false },
    price: { type: String, required: true },
    OnlyPrice: { type: Number, required: true },
    slug: { type: String, required: true },
});

const scrapSchema = new mongoose.Schema({
    id: { type: Number, required: true },
    name: { type: String, required: true },
    types: [typeSchema],
    isSelected: { type: Boolean, default: false },
    image: { type: String, required: true }, // Add the image field here
});

module.exports = mongoose.model('ScrapListNew1', scrapSchema);
