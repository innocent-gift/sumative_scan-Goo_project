const router = require('express').Router();
const Session = require('../models/Session');
const Product = require('../models/Product');
const { v4: uuid } = require('uuid');
const auth = require('../middleware/auth'); // make sure this path is correct

// Start session
router.post('/start', auth, async (req, res) => {
  try {
    const session = await Session.create({
      userId: req.user._id,
      sessionId: uuid(),
      items: [],
      totalPrice: 0,
      totalWeight: 0,
      status: 'active'
    });
    res.json({ session });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to start session' });
  }
});

// Get current user's active session
router.get('/mine', auth, async (req, res) => {
  try {
    const session = await Session.findOne({ userId: req.user._id, status: 'active' });
    if (!session) return res.status(404).json({ error: 'No active session found' });
    res.json({ session });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch session' });
  }
});

// Scan a product
router.post('/:id/scan', auth, async (req, res) => {
  try {
    const session = await Session.findOne({ sessionId: req.params.id });
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const product = await Product.findOne({ id: req.body.productId });
    if (!product) return res.status(404).json({ error: 'Product not found' });

    let item = session.items.find(i => i.productSnapshot.id === product.id);
    if (item) item.qty++;
    else session.items.push({ productSnapshot: product, qty: 1 });

    session.totalPrice += product.price;
    session.totalWeight += product.weight;

    await session.save();
    res.json({ session });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to scan product' });
  }
});

// Update item quantity
router.patch('/:id/item', auth, async (req, res) => {
  try {
    const session = await Session.findOne({ sessionId: req.params.id });
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const item = session.items.find(i => i.productSnapshot.id === req.body.productId);
    if (!item) return res.json({ session });

    item.qty += req.body.delta;
    if (item.qty <= 0) session.items = session.items.filter(i => i !== item);

    await session.save();
    res.json({ session });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update item' });
  }
});

// Clear cart
router.delete('/:id/cart', auth, async (req, res) => {
  try {
    const session = await Session.findOne({ sessionId: req.params.id });
    if (!session) return res.status(404).json({ error: 'Session not found' });

    session.items = [];
    session.totalPrice = 0;
    session.totalWeight = 0;
    await session.save();

    res.json({ session });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to clear cart' });
  }
});

// Checkout
router.post('/:id/checkout', auth, async (req, res) => {
  try {
    const session = await Session.findOne({ sessionId: req.params.id });
    if (!session) return res.status(404).json({ error: 'Session not found' });

    session.payment = {
      method: req.body.method,
      txnId: 'SG-' + Math.floor(Math.random() * 9999)
    };

    await session.save();
    res.json({ txnId: session.payment.txnId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Checkout failed' });
  }
});

// Confirm session
router.post('/:id/confirm', auth, async (req, res) => {
  try {
    const session = await Session.findOne({ sessionId: req.params.id });
    if (!session) return res.status(404).json({ error: 'Session not found' });

    session.status = 'completed';
    await session.save();
    res.json({ session });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to confirm session' });
  }
});

module.exports = router;
