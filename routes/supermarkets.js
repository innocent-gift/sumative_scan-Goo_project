const router = require('express').Router();
const Supermarket = require('../models/Supermarket');
const auth = require('../middleware/auth');

// Get all supermarkets (public for shoppers to browse)
router.get('/', async (req, res) => {
  try {
    res.json({ supermarkets: await Supermarket.find() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Stats for platform dashboard
router.get('/stats', auth, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') return res.status(403).json({ message: 'Forbidden.' });
    const all = await Supermarket.find();
    res.json({
      stats: {
        total: all.length,
        active: all.filter(s => s.status === 'active').length,
        suspended: all.filter(s => s.status === 'suspended').length
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create supermarket (platform owner only)
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') return res.status(403).json({ message: 'Forbidden.' });
    const sup = await Supermarket.create(req.body);
    res.status(201).json({ supermarket: sup });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update status (platform owner only)
router.patch('/:id/status', auth, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') return res.status(403).json({ message: 'Forbidden.' });
    await Supermarket.findByIdAndUpdate(req.params.id, { status: req.body.status });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete supermarket (platform owner only)
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') return res.status(403).json({ message: 'Forbidden.' });
    await Supermarket.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
