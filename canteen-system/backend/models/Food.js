const mongoose = require('mongoose');

const CATEGORIES = ['Breakfast', 'Lunch', 'Snacks', 'Beverages', 'Desserts'];

const foodSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 60 },
    description: { type: String, trim: true, maxlength: 300, default: '' },
    price: { type: Number, required: true, min: 1, max: 10000 },
    category: { type: String, enum: CATEGORIES, required: true },
    image: { type: String, default: '' },
    available: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Food', foodSchema);
module.exports.CATEGORIES = CATEGORIES;
