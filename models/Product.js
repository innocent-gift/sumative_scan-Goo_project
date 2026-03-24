const mongoose = require('mongoose');

module.exports = mongoose.model('Product', new mongoose.Schema({
  id: String,
  name: String,
  price: Number,
  emoji: String,
  weight: Number
}));
