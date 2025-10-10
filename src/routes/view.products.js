const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Feedback = require('../models/Feedback');
const { ensureAuthenticated } = require('../middleware/authView');
const { requireRole, ROLES } = require('../middleware/authorize');

console.log('[DEBUG] loaded view.products router');

// list
router.get('/', async (req, res, next) => {
  try {
    const products = await Product.find().populate('createdBy', 'username').lean();
    console.log('[DEBUG] products list ids =', products.map(p => String(p._id)).slice(0,50));
    res.render('products/index', { products });
  } catch (err) {
    next(err);
  }
});

// new (place before :id)
router.get('/new', ensureAuthenticated, requireRole(ROLES.ADMIN), (req, res) => {
  res.render('products/new');
});

router.post('/new', ensureAuthenticated, requireRole(ROLES.ADMIN), async (req, res, next) => {
  try {
    const { name, price, description, brand, imageUrl } = req.body;
    const product = new Product({
      name,
      price: parseFloat(price) || 0,
      description,
      brand,
      imageUrl,
      createdBy: req.user ? req.user._id : undefined
    });
    await product.save();
    res.redirect('/products');
  } catch (err) {
    next(err);
  }
});

// detail (with robust debug + ObjectId check)
router.get('/:id', async (req, res, next) => {
  try {
    const id = req.params.id;
    console.log('[DEBUG] GET /products/:id param =', id);

    if (!mongoose.isValidObjectId(id)) {
      console.log('[DEBUG] invalid ObjectId:', id);
      return res.status(404).render('errors/404');
    }

    const product = await Product.findById(id).lean();
    if (!product) {
      const allIds = (await Product.find().select('_id').lean()).map(p => String(p._id));
      console.log('[DEBUG] Product not found for id=', id, 'existing product ids=', allIds.slice(0,50));
      return res.status(404).render('errors/404');
    }

    const feedbacks = await Feedback.find({ product: id })
      .populate('member', 'username fullname')
      .sort({ createdAt: -1 })
      .lean();

    let myFeedback = null;
    if (req.user) myFeedback = await Feedback.findOne({ product: id, member: req.user._id }).lean();

    res.render('products/detail', { product, feedbacks, myFeedback, user: req.user });
  } catch (err) {
    console.error('[ERROR] GET /products/:id', err);
    next(err);
  }
});

// create/update feedback
router.post('/:id/feedback', ensureAuthenticated, async (req, res, next) => {
  try {
    const productId = req.params.id;
    const memberId = req.user._id;
    const { comment, rating } = req.body;
    if (!comment || String(comment).trim().length === 0) return res.redirect(`/products/${productId}`);

    await require('../models/Feedback').findOneAndUpdate(
      { product: productId, member: memberId },
      { comment: String(comment).trim(), rating: rating ? Number(rating) : 5, updatedAt: new Date() },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.redirect(`/products/${productId}`);
  } catch (err) {
    if (err.code === 11000) return res.redirect(`/products/${req.params.id}`);
    next(err);
  }
});

module.exports = router;
