const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
app.use(express.json());

// ------------------- MONGODB CONNECTION -------------------
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err.message));

// ------------------- MONGOOSE SCHEMA -------------------
const scanSchema = new mongoose.Schema({
  barcode: { type: String, required: true, unique: true },
  description: { type: String },
  createdAt: { type: Date, default: Date.now },
});

// Only one index definition per field
scanSchema.index({ barcode: 1 });

const Scan = mongoose.model('Scan', scanSchema);

// ------------------- JWT MIDDLEWARE -------------------
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ success: false, error: 'No token provided' });

  const token = authHeader.split(' ')[1]; // Expecting "Bearer <token>"
  if (!token) return res.status(401).json({ success: false, error: 'Malformed token' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ success: false, error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// ------------------- JWT HELPER -------------------
const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// ------------------- ROUTES -------------------

// Public test route
app.get('/', (req, res) => res.send('Server running!'));

// Route to generate a JWT
app.post('/login', (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ success: false, error: 'Username required' });

  const token = generateToken({ username });
  res.json({ success: true, token });
});

// Protected routes: require JWT
app.post('/scan', authenticateToken, async (req, res) => {
  try {
    const { barcode, description } = req.body;
    const newScan = await Scan.create({ barcode, description });
    res.status(201).json({ success: true, data: newScan });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.get('/scans', authenticateToken, async (req, res) => {
  try {
    const scans = await Scan.find();
    res.json({ success: true, data: scans });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ------------------- START SERVER -------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
