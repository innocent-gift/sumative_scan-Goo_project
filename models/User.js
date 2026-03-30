const mongoose = require('mongoose');

module.exports = mongoose.model('User', new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  phone: String,
  password: String,
  role: { type: String, default: 'shopper' }, // shopper, admin, superadmin
  supermarketId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supermarket', default: null },
  supermarketName: { type: String, default: null },
  resetToken: { type: String, default: null },
  resetTokenExpiry: { type: Date, default: null }
}, { timestamps: true }));
