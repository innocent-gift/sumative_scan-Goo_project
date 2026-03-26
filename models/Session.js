const mongoose = require('mongoose');

module.exports = mongoose.model('Session', new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  supermarketId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supermarket', default: null },
  sessionId: { type: String, required: true, unique: true },
  status: { type: String, default: 'active' }, // active, completed, abandoned
  items: [
    {
      productSnapshot: Object,
      qty: { type: Number, default: 1 }
    }
  ],
  totalPrice: { type: Number, default: 0 },
  totalWeight: { type: Number, default: 0 },
  payment: Object
}, { timestamps: true }));
