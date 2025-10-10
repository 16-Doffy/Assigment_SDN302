const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { ensureAuthenticated } = require('../middleware/authView');
const { requireRole, ROLES } = require('../middleware/authorize');

console.log('[DEBUG] loaded view.products router'); // <-- nếu thấy dòng này trong console thì router được require

router.get('/', async (req, res, next) => {
  console.log('[DEBUG] GET /products hit — req.user=', !!req.user, req.user && req.user.username);
  try {
    const products = await Product.find().populate('createdBy', 'username').lean();
    res.render('products/index', { products });
  } catch (err) {
    next(err);
  }
});

router.get('/new', ensureAuthenticated, requireRole(ROLES.ADMIN), (req, res) => {
  console.log('[DEBUG] GET /products/new hit — req.user=', req.user && req.user.username);
  res.render('products/new');
});

router.post('/new', ensureAuthenticated, requireRole(ROLES.ADMIN), async (req, res, next) => {
  console.log('[DEBUG] POST /products/new hit by', req.user && req.user.username);
  try {
    const { name, price, description } = req.body;
    const product = new Product({
      name,
      price: parseFloat(price) || 0,
      description,
      createdBy: req.user ? req.user._id : undefined
    });
    await product.save();
    res.redirect('/products');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
