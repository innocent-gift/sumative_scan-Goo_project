const mongoose = require('mongoose');

module.exports = mongoose.model('Session', new mongoose.Schema({
  userId: String,
  supermarketId: String,
  sessionId: String,
  status: { type: String, default: 'active' },
  items: [
    {
      productSnapshot: Object,
      qty: Number
    }
  ],
  totalPrice: { type: Number, default: 0 },
  totalWeight: { type: Number, default: 0 },
  payment: Object
}, { timestamps: true }));
