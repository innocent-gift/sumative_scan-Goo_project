const mongoose = require('mongoose');

module.exports = mongoose.model('Supermarket', new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  city: String,
  status: { type: String, default: 'active' },
  plan: { type: String, default: 'free' }
}, { timestamps: true }));
