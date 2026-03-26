const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// ------------------- MONGODB CONNECTION -------------------
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err.message));

// ------------------- ROUTES -------------------
app.use('/api/auth', require('../routes/auth'));
app.use('/api/sessions', require('../routes/sessions'));
app.use('/api/products', require('../routes/products'));
app.use('/api/supermarkets', require('../routes/supermarkets'));
app.use('/api/alerts', require('../routes/alerts'));

app.get('/', (req, res) => res.send('Server running!'));

// ------------------- START SERVER -------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
