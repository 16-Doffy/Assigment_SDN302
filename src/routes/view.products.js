const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Feedback = require('../models/Feedback');
const Member = require('../models/Member');
const { ensureAuthenticated } = require('../middleware/authView');
const { requireRole, requirePermission, ROLES, PERMISSIONS } = require('../middleware/authorize');
const { body, validationResult } = require('express-validator');

console.log('[DEBUG] loaded view.products router');

// list - public with search and brand filter
router.get('/', async (req, res, next) => {
  try {
    const { q, brand } = req.query;
    const filter = {};
    const hasName = q && String(q).trim().length > 0;
    const hasBrand = brand && String(brand).trim().length > 0;
    if (hasName) {
      filter.name = { $regex: String(q).trim(), $options: 'i' };
    }
    if (!hasName && hasBrand) {
      // Only apply brand filter if user didn't type a name
      filter.brand = { $regex: String(brand).trim(), $options: 'i' };
    }
    const products = await Product.find(filter).populate('createdBy', 'username').lean();
    const allBrands = await Product.distinct('brand');
    console.log('[DEBUG] products list ids =', products.map(p => String(p._id)).slice(0,50));
    res.render('products/index', { products, member: req.session?.member, q: q || '', selectedBrand: brand || '', brands: allBrands.filter(Boolean).sort() });
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
    body('imageUrl').optional({ checkFalsy: true }).isURL({ require_protocol: true }).withMessage('URL hình ảnh phải là https://...'),
    body('category').optional().trim().isLength({ max: 50 }).withMessage('Danh mục không quá 50 ký tự'),
    body('stock').optional().isInt({ min: 0 }).withMessage('Số lượng tồn kho phải là số nguyên dương'),
    body('targetAudience').optional().trim().isLength({ max: 20 }).withMessage('Đối tượng tối đa 20 ký tự'),
    body('extrait').optional().trim().isLength({ max: 20 }).withMessage('Extrait tối đa 20 ký tự')
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

      const { name, price, description, brand, imageUrl, category, stock, targetAudience, extrait } = req.body;
      const product = new Product({
        name: name.trim(),
        price: Number.isFinite(parseFloat(price)) ? parseFloat(price) : 0,
        description: description ? description.trim() : '',
        brand: brand ? brand.trim() : '',
        imageUrl: imageUrl ? imageUrl.trim() : '',
        category: category ? category.trim() : 'General',
        stock: Number.isFinite(parseInt(stock)) ? parseInt(stock) : 0,
        targetAudience: targetAudience ? targetAudience.trim() : undefined,
        extrait: extrait ? extrait.trim() : undefined,
        createdBy: req.user ? req.user._id : undefined
      });
      
      await product.save();
      return res.redirect('/products');
    } catch (err) {
      next(err);
    }
  }
);

// detail - public
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

    const ratingCount = feedbacks.length;
    const averageRating = ratingCount
      ? (feedbacks.reduce((sum, f) => sum + (Number(f.rating) || 0), 0) / ratingCount)
      : null;

    let myFeedback = null;
    if (req.session.member && req.session.member.id) {
      const memberDoc = await Member.findById(req.session.member.id);
      if (memberDoc) {
        myFeedback = await Feedback.findOne({ product: id, member: memberDoc._id }).lean();
      }
    }

    const success = req.session.success;
    if (success) delete req.session.success; // Clear the message after showing
    res.render('products/detail', { product, feedbacks, ratingCount, averageRating, myFeedback, user: req.session.member, member: req.session.member, success });
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

    const success = req.session.success;
    if (success) delete req.session.success; // Clear the message after showing
    res.render('products/edit', { product, member: req.session.member, success });
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
    body('imageUrl').optional({ checkFalsy: true }).isURL().withMessage('URL hình ảnh không hợp lệ'),
    body('category').optional().trim().isLength({ max: 50 }).withMessage('Danh mục không quá 50 ký tự'),
    body('stock').optional().isInt({ min: 0 }).withMessage('Số lượng tồn kho phải là số nguyên dương'),
    body('targetAudience').optional().trim().isLength({ max: 20 }).withMessage('Đối tượng tối đa 20 ký tự'),
    body('extrait').optional().trim().isLength({ max: 20 }).withMessage('Extrait tối đa 20 ký tự')
  ],
  async (req, res, next) => {
    try {
      console.log('[DEBUG] PUT request body:', req.body);
      const id = req.params.id;
      if (!mongoose.isValidObjectId(id)) {
        return res.status(404).render('errors/404');
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log('[DEBUG] Validation errors:', errors.array());
        const product = await Product.findById(id).lean();
        return res.render('products/edit', { 
          product,
          errors: errors.array(), 
          member: req.session.member,
          formData: req.body
        });
      }

      const { name, price, description, brand, imageUrl, category, stock, isActive, targetAudience, extrait } = req.body;
      console.log('[DEBUG] Update data received:', { targetAudience, extrait, isActive });
      console.log('[DEBUG] All form fields:', Object.keys(req.body));
      
      const updateData = {
        name: name.trim(),
        price: parseFloat(price),
        description: description ? description.trim() : '',
        brand: brand ? brand.trim() : '',
        imageUrl: imageUrl ? imageUrl.trim() : '',
        category: category ? category.trim() : 'General',
        stock: parseInt(stock) || 0,
        isActive: isActive === 'on',
        targetAudience: targetAudience ? targetAudience.trim() : 'Unisex',
        extrait: extrait ? extrait.trim() : 'EDP'
      };
      
      console.log('[DEBUG] Update data to save:', updateData);
      const result = await Product.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
      console.log('[DEBUG] Update result:', result);
      
      // Add success message to session
      req.session.success = 'Sản phẩm đã được cập nhật thành công!';
      return res.redirect(`/products/${id}`);
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
    const sessionUser = req.session?.member;
    if (!sessionUser || sessionUser.role !== 'user') {
      return res.redirect(`/products/${productId}`);
    }
    const memberId = sessionUser.id;
    const { comment, rating } = req.body;
    if (!comment || String(comment).trim().length === 0) return res.redirect(`/products/${productId}`);

    await require('../models/Feedback').findOneAndUpdate(
      { product: productId, member: memberId },
      { comment: String(comment).trim(), rating: rating ? Math.max(1, Math.min(3, Number(rating))) : 3, updatedAt: new Date() },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.redirect(`/products/${productId}`);
  } catch (err) {
    if (err.code === 11000) return res.redirect(`/products/${req.params.id}`);
    next(err);
  }
});

// User deletes own feedback
router.delete('/:productId/feedback/:feedbackId', ensureAuthenticated, async (req, res, next) => {
  try {
    const { productId, feedbackId } = req.params;
    const sessionUser = req.session?.member;
    if (!sessionUser) return res.redirect(`/products/${productId}`);

    const feedback = await Feedback.findById(feedbackId);
    if (!feedback) return res.redirect(`/products/${productId}`);

    const isOwner = String(feedback.member) === String(sessionUser.id);
    const isAdmin = sessionUser.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).render('errors/403');
    }

    await Feedback.findByIdAndDelete(feedbackId);
    return res.redirect(`/products/${productId}`);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
