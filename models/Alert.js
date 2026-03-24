const mongoose = require('mongoose');

module.exports = mongoose.model('Alert', new mongoose.Schema({
  title: String,
  detail: String,
  icon: String,
  time: String
}));
