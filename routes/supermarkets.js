const router = require('express').Router();
const Supermarket = require('../models/Supermarket');

router.get('/', async (req, res) => {
  res.json({ supermarkets: await Supermarket.find() });
});

router.post('/', async (req, res) => {
  const sup = await Supermarket.create(req.body);
  res.json(sup);
});

router.patch('/:id/status', async (req, res) => {
  await Supermarket.findByIdAndUpdate(req.params.id, { status: req.body.status });
  res.json({ success: true });
});

router.delete('/:id', async (req, res) => {
  await Supermarket.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

module.exports = router;
