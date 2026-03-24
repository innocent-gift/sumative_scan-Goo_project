const router = require('express').Router();
const Product = require('../models/Product');

router.get('/', async (req, res) => {
  res.json({ products: await Product.find() });
});

module.exports = router;
