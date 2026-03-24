const router = require('express').Router();
const Alert = require('../models/Alert');

router.get('/', async (req, res) => {
  res.json({ alerts: await Alert.find().sort({ createdAt: -1 }).limit(10) });
});

module.exports = router;
