const router = require('express').Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');

function signToken(user) {
  return jwt.sign(
    { _id: user._id, role: user.role, email: user.email, supermarketId: user.supermarketId, supermarketName: user.supermarketName },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

// Register shopper
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'Name, email and password are required.' });
    if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters.' });

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'An account with this email already exists.' });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, phone, password: hashed, role: 'shopper' });
    res.status(201).json({ message: 'Account created successfully.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Register admin (called by platform owner)
router.post('/register-admin', auth, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') return res.status(403).json({ message: 'Forbidden.' });
    const { name, email, password, supermarketId, supermarketName, role } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required.' });
    if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters.' });

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'An account with this email already exists.' });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed, role: role || 'admin', supermarketId, supermarketName });
    res.status(201).json({ message: 'Admin account created.', userId: user._id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Reset admin password (called by platform owner)
router.post('/reset-admin-password', auth, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') return res.status(403).json({ message: 'Forbidden.' });
    const { email, newPassword } = req.body;
    if (!email || !newPassword) return res.status(400).json({ message: 'Email and new password are required.' });
    if (newPassword.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters.' });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found.' });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ message: 'Password reset successfully.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Login (all roles)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required.' });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid email or password.' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ message: 'Invalid email or password.' });

    const token = signToken(user);
    res.json({
      token,
      user: { _id: user._id, name: user.name, email: user.email, role: user.role, supermarketId: user.supermarketId, supermarketName: user.supermarketName }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
