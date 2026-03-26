const router = require('express').Router();
const Session = require('../models/Session');
const Product = require('../models/Product');
const User = require('../models/User');
const { v4: uuid } = require('uuid');
const auth = require('../middleware/auth');

// ── Admin endpoints ────────────────────────────────────────

// KPIs for admin/platform dashboard
router.get('/admin/kpis', auth, async (req, res) => {
  try {
    if (!['admin', 'superadmin'].includes(req.user.role)) return res.status(403).json({ message: 'Forbidden.' });

    const query = req.user.role === 'admin' ? { supermarketId: req.user.supermarketId } : {};
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);

    const [allActive, completedToday] = await Promise.all([
      Session.find({ ...query, status: 'active' }),
      Session.find({ ...query, status: 'completed', updatedAt: { $gte: todayStart } })
    ]);

    const todayRevenue = completedToday.reduce((s, sess) => s + (sess.totalPrice || 0), 0);
    const totalItemsInCarts = allActive.reduce((s, sess) => s + sess.items.reduce((a, i) => a + i.qty, 0), 0);
    const liveValue = allActive.reduce((s, sess) => s + (sess.totalPrice || 0), 0);

    res.json({
      kpis: {
        activeShoppers: allActive.length,
        completedToday: completedToday.length,
        todayRevenue,
        totalItemsInCarts,
        liveValue
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Live active sessions
router.get('/admin/live', auth, async (req, res) => {
  try {
    if (!['admin', 'superadmin'].includes(req.user.role)) return res.status(403).json({ message: 'Forbidden.' });

    const query = req.user.role === 'admin' ? { supermarketId: req.user.supermarketId, status: 'active' } : { status: 'active' };
    const sessions = await Session.find(query).sort({ updatedAt: -1 }).limit(20);

    const userIds = [...new Set(sessions.map(s => s.userId).filter(Boolean))];
    const users = await User.find({ _id: { $in: userIds } }).select('name email');
    const userMap = Object.fromEntries(users.map(u => [u._id.toString(), u]));

    res.json({
      sessions: sessions.map(s => ({
        sessionId: s.sessionId,
        shopperName: userMap[s.userId]?.name || 'Guest',
        totalItems: s.items.reduce((a, i) => a + i.qty, 0),
        totalPrice: s.totalPrice,
        totalWeight: s.totalWeight,
        status: s.status,
        updatedAt: s.updatedAt
      }))
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Completed sessions today
router.get('/admin/completed', auth, async (req, res) => {
  try {
    if (!['admin', 'superadmin'].includes(req.user.role)) return res.status(403).json({ message: 'Forbidden.' });

    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const query = req.user.role === 'admin'
      ? { supermarketId: req.user.supermarketId, status: 'completed', updatedAt: { $gte: todayStart } }
      : { status: 'completed', updatedAt: { $gte: todayStart } };

    const sessions = await Session.find(query).sort({ updatedAt: -1 }).limit(50);

    const userIds = [...new Set(sessions.map(s => s.userId).filter(Boolean))];
    const users = await User.find({ _id: { $in: userIds } }).select('name email');
    const userMap = Object.fromEntries(users.map(u => [u._id.toString(), u]));

    res.json({
      sessions: sessions.map(s => ({
        sessionId: s.sessionId,
        shopperName: userMap[s.userId]?.name || 'Guest',
        totalPrice: s.totalPrice,
        payment: {
          methodLabel: s.payment?.method || '—',
          txnId: s.payment?.txnId || '—',
          total: s.totalPrice
        }
      }))
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Inventory — most scanned products in active sessions
router.get('/admin/inventory', auth, async (req, res) => {
  try {
    if (!['admin', 'superadmin'].includes(req.user.role)) return res.status(403).json({ message: 'Forbidden.' });

    const query = req.user.role === 'admin' ? { supermarketId: req.user.supermarketId, status: 'active' } : { status: 'active' };
    const sessions = await Session.find(query);

    const tally = {};
    for (const sess of sessions) {
      for (const item of sess.items) {
        const snap = item.productSnapshot;
        const key = snap.id || snap._id?.toString();
        if (!key) continue;
        if (!tally[key]) tally[key] = { product: snap, qty: 0, revenue: 0 };
        tally[key].qty += item.qty;
        tally[key].revenue += (snap.price || 0) * item.qty;
      }
    }

    const inventory = Object.values(tally).sort((a, b) => b.qty - a.qty);
    res.json({ inventory });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Shopper endpoints ──────────────────────────────────────

// Start session
router.post('/start', auth, async (req, res) => {
  try {
    // Close any existing active session first
    await Session.updateMany({ userId: req.user._id, status: 'active' }, { status: 'abandoned' });

    const session = await Session.create({
      userId: req.user._id,
      supermarketId: req.body.supermarketId || null,
      sessionId: uuid(),
      items: [],
      totalPrice: 0,
      totalWeight: 0,
      status: 'active'
    });
    res.json({ session });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get current user's active session
router.get('/mine', auth, async (req, res) => {
  try {
    const session = await Session.findOne({ userId: req.user._id, status: 'active' });
    if (!session) return res.status(404).json({ error: 'No active session found' });
    res.json({ session });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Scan a product
router.post('/:id/scan', auth, async (req, res) => {
  try {
    const session = await Session.findOne({ sessionId: req.params.id });
    if (!session) return res.status(404).json({ error: 'Session not found' });
    if (session.userId.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Forbidden.' });

    const product = await Product.findOne({ id: req.body.productId });
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const item = session.items.find(i => i.productSnapshot.id === product.id);
    if (item) item.qty++;
    else session.items.push({ productSnapshot: product.toObject(), qty: 1 });

    session.totalPrice += product.price;
    session.totalWeight += product.weight || 0;

    await session.save();
    res.json({ session });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update item quantity
router.patch('/:id/item', auth, async (req, res) => {
  try {
    const session = await Session.findOne({ sessionId: req.params.id });
    if (!session) return res.status(404).json({ error: 'Session not found' });
    if (session.userId.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Forbidden.' });

    const item = session.items.find(i => i.productSnapshot.id === req.body.productId);
    if (item) {
      item.qty += req.body.delta;
      const priceDelta = (item.productSnapshot.price || 0) * req.body.delta;
      const weightDelta = (item.productSnapshot.weight || 0) * req.body.delta;
      session.totalPrice = Math.max(0, session.totalPrice + priceDelta);
      session.totalWeight = Math.max(0, session.totalWeight + weightDelta);
      if (item.qty <= 0) session.items = session.items.filter(i => i !== item);
    }

    await session.save();
    res.json({ session });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Clear cart
router.delete('/:id/cart', auth, async (req, res) => {
  try {
    const session = await Session.findOne({ sessionId: req.params.id });
    if (!session) return res.status(404).json({ error: 'Session not found' });
    if (session.userId.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Forbidden.' });

    session.items = [];
    session.totalPrice = 0;
    session.totalWeight = 0;
    await session.save();
    res.json({ session });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Checkout
router.post('/:id/checkout', auth, async (req, res) => {
  try {
    const session = await Session.findOne({ sessionId: req.params.id });
    if (!session) return res.status(404).json({ error: 'Session not found' });
    if (session.userId.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Forbidden.' });

    session.payment = {
      method: req.body.method,
      phone: req.body.phone,
      txnId: 'SG-' + Math.floor(Math.random() * 99999).toString().padStart(5, '0')
    };
    await session.save();
    res.json({ txnId: session.payment.txnId });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Confirm session
router.post('/:id/confirm', auth, async (req, res) => {
  try {
    const session = await Session.findOne({ sessionId: req.params.id });
    if (!session) return res.status(404).json({ error: 'Session not found' });
    if (session.userId.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Forbidden.' });

    session.status = 'completed';
    await session.save();
    res.json({ session });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
