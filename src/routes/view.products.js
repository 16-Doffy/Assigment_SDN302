const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Feedback = require('../models/Feedback');
const { ensureAuthenticated } = require('../middleware/authView');
const { requireRole, requirePermission, ROLES, PERMISSIONS } = require('../middleware/authorize');
const { body, validationResult } = require('express-validator');

console.log('[DEBUG] loaded view.products router');

// list - cần authentication
router.get('/', ensureAuthenticated, async (req, res, next) => {
  try {
    const products = await Product.find().populate('createdBy', 'username').lean();
    console.log('[DEBUG] products list ids =', products.map(p => String(p._id)).slice(0,50));
    res.render('products/index', { products, member: req.session.member });
  } catch (err) {
    next(err);
  }
});

// CREATE - New product form
router.get('/new', ensureAuthenticated, requirePermission(PERMISSIONS.PRODUCTS.CREATE), (req, res) => {
  res.render('products/new', { member: req.session.member });
});

// CREATE - Handle new product submission
router.post('/new', 
  ensureAuthenticated, 
  requirePermission(PERMISSIONS.PRODUCTS.CREATE),
  [
    body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Tên sản phẩm phải từ 2-100 ký tự'),
    body('price').isFloat({ min: 0 }).withMessage('Giá phải là số dương'),
    body('description').optional().trim().isLength({ max: 500 }).withMessage('Mô tả không quá 500 ký tự'),
    body('brand').optional().trim().isLength({ max: 50 }).withMessage('Thương hiệu không quá 50 ký tự'),
    body('imageUrl').optional().isURL().withMessage('URL hình ảnh không hợp lệ'),
    body('category').optional().trim().isLength({ max: 50 }).withMessage('Danh mục không quá 50 ký tự'),
    body('stock').optional().isInt({ min: 0 }).withMessage('Số lượng tồn kho phải là số nguyên dương')
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.render('products/new', { 
          errors: errors.array(), 
          member: req.session.member,
          formData: req.body
        });
      }

      const { name, price, description, brand, imageUrl, category, stock } = req.body;
      const product = new Product({
        name: name.trim(),
        price: parseFloat(price),
        description: description ? description.trim() : '',
        brand: brand ? brand.trim() : '',
        imageUrl: imageUrl ? imageUrl.trim() : '',
        category: category ? category.trim() : 'General',
        stock: parseInt(stock) || 0,
        createdBy: req.user ? req.user._id : undefined
      });
      
      await product.save();
      req.flash('success', 'Sản phẩm đã được tạo thành công!');
      res.redirect('/products');
    } catch (err) {
      next(err);
    }
  }
);

// detail (with robust debug + ObjectId check) - cần authentication
router.get('/:id', ensureAuthenticated, async (req, res, next) => {
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

    res.render('products/detail', { product, feedbacks, myFeedback, user: req.user, member: req.session.member });
  } catch (err) {
    console.error('[ERROR] GET /products/:id', err);
    next(err);
  }
});

// UPDATE - Edit product form
router.get('/:id/edit', ensureAuthenticated, requirePermission(PERMISSIONS.PRODUCTS.UPDATE), async (req, res, next) => {
  try {
    const id = req.params.id;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(404).render('errors/404');
    }

    const product = await Product.findById(id).lean();
    if (!product) {
      return res.status(404).render('errors/404');
    }

    res.render('products/edit', { product, member: req.session.member });
  } catch (err) {
    next(err);
  }
});

// UPDATE - Handle product update
router.put('/:id', 
  ensureAuthenticated, 
  requirePermission(PERMISSIONS.PRODUCTS.UPDATE),
  [
    body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Tên sản phẩm phải từ 2-100 ký tự'),
    body('price').isFloat({ min: 0 }).withMessage('Giá phải là số dương'),
    body('description').optional().trim().isLength({ max: 500 }).withMessage('Mô tả không quá 500 ký tự'),
    body('brand').optional().trim().isLength({ max: 50 }).withMessage('Thương hiệu không quá 50 ký tự'),
    body('imageUrl').optional().isURL().withMessage('URL hình ảnh không hợp lệ'),
    body('category').optional().trim().isLength({ max: 50 }).withMessage('Danh mục không quá 50 ký tự'),
    body('stock').optional().isInt({ min: 0 }).withMessage('Số lượng tồn kho phải là số nguyên dương')
  ],
  async (req, res, next) => {
    try {
      const id = req.params.id;
      if (!mongoose.isValidObjectId(id)) {
        return res.status(404).render('errors/404');
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const product = await Product.findById(id).lean();
        return res.render('products/edit', { 
          product,
          errors: errors.array(), 
          member: req.session.member,
          formData: req.body
        });
      }

      const { name, price, description, brand, imageUrl, category, stock, isActive } = req.body;
      const updateData = {
        name: name.trim(),
        price: parseFloat(price),
        description: description ? description.trim() : '',
        brand: brand ? brand.trim() : '',
        imageUrl: imageUrl ? imageUrl.trim() : '',
        category: category ? category.trim() : 'General',
        stock: parseInt(stock) || 0,
        isActive: isActive === 'on'
      };

      await Product.findByIdAndUpdate(id, updateData);
      req.flash('success', 'Sản phẩm đã được cập nhật thành công!');
      res.redirect('/products');
    } catch (err) {
      next(err);
    }
  }
);

// DELETE - Handle product deletion
router.delete('/:id', ensureAuthenticated, requirePermission(PERMISSIONS.PRODUCTS.DELETE), async (req, res, next) => {
  try {
    const id = req.params.id;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(404).json({ success: false, message: 'Sản phẩm không tồn tại' });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Sản phẩm không tồn tại' });
    }

    // Xóa tất cả feedback liên quan
    await Feedback.deleteMany({ product: id });
    
    // Xóa sản phẩm
    await Product.findByIdAndDelete(id);
    
    res.json({ success: true, message: 'Sản phẩm đã được xóa thành công!' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi khi xóa sản phẩm' });
  }
});

// create/update feedback
router.post('/:id/feedback', ensureAuthenticated, requirePermission(PERMISSIONS.FEEDBACK.CREATE), async (req, res, next) => {
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
