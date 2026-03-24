const mongoose = require('mongoose');

module.exports = mongoose.model('User', new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  phone: String,
  password: String,
  role: { type: String, default: 'shopper' } // shopper, admin, superadmin
}, { timestamps: true }));
