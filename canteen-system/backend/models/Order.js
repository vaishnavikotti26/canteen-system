const mongoose = require('mongoose');

const STATUSES = ['Pending', 'Preparing', 'Ready', 'Completed', 'Cancelled'];

const orderSchema = new mongoose.Schema(
  {
    orderId: { type: String, required: true, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [
      {
        food: { type: mongoose.Schema.Types.ObjectId, ref: 'Food' },
        name: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true, min: 1, max: 20 },
      },
    ],
    total: { type: Number, required: true },
    note: { type: String, trim: true, maxlength: 200, default: '' },
    status: { type: String, enum: STATUSES, default: 'Pending' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
module.exports.STATUSES = STATUSES;
