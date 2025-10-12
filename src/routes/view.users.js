const express = require('express');
const { body, param, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const { ensureAuthenticated } = require('../middleware/authView');
const { requirePermission, PERMISSIONS } = require('../middleware/authorize');
const Member = require('../models/Member');

const router = express.Router();

// Tất cả routes đều cần authentication
router.use(ensureAuthenticated);

// Danh sách users (chỉ admin)
router.get('/', requirePermission(PERMISSIONS.USERS.VIEW), async (req, res) => {
  try {
    const users = await Member.find().select('-password').sort({ createdAt: -1 });
    res.render('users/index', { users, member: req.session.member });
  } catch (err) {
    res.status(500).render('errors/500', { error: err.message });
  }
});

// Form tạo user mới (chỉ admin)
router.get('/new', requirePermission(PERMISSIONS.USERS.CREATE), (req, res) => {
  res.render('users/new', {
    values: { username: '', password: '', fullname: '', birthYear: '', role: 'user' },
    errors: {},
    roles: ['guest', 'member', 'admin']
  });
});

// Tạo user mới (chỉ admin)
router.post('/new', 
  requirePermission(PERMISSIONS.USERS.CREATE),
  body('username').isString().trim().isLength({ min: 3, max: 50 }),
  body('password').isString().isLength({ min: 6 }),
  body('fullname').optional().isString().trim(),
  body('birthYear').optional().isInt({ min: 1900, max: 2100 }),
  body('role').isIn(['guest', 'member', 'admin']),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).render('users/new', {
          values: req.body,
          errors: Object.fromEntries(errors.array().map((e) => [e.path, e.msg])),
          roles: ['guest', 'member', 'admin']
        });
      }

      // Kiểm tra username đã tồn tại
      const existingUser = await Member.findOne({ username: req.body.username });
      if (existingUser) {
        return res.status(400).render('users/new', {
          values: req.body,
          errors: { username: 'Username already exists' },
          roles: ['guest', 'member', 'admin']
        });
      }

      // Tạo user mới
      const hashedPassword = await bcrypt.hash(req.body.password, 10);
      const user = new Member({
        username: req.body.username.trim(),
        password: hashedPassword,
        fullname: req.body.fullname?.trim() || '',
        birthYear: req.body.birthYear ? parseInt(req.body.birthYear) : undefined,
        role: req.body.role
      });

      await user.save();
      res.redirect('/view/users');
    } catch (err) {
      res.status(500).render('errors/500', { error: err.message });
    }
  }
);

// Form chỉnh sửa user (chỉ admin)
router.get('/:id/edit', requirePermission(PERMISSIONS.USERS.UPDATE), async (req, res) => {
  try {
    const user = await Member.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).render('errors/404');
    }

    res.render('users/edit', {
      values: {
        _id: user._id.toString(),
        username: user.username,
        fullname: user.fullname || '',
        birthYear: user.birthYear || '',
        role: user.role
      },
      errors: {},
      roles: ['guest', 'member', 'admin']
    });
  } catch (err) {
    res.status(500).render('errors/500', { error: err.message });
  }
});

// Cập nhật user (chỉ admin)
router.put('/:id',
  requirePermission(PERMISSIONS.USERS.UPDATE),
  param('id').isMongoId(),
  body('username').isString().trim().isLength({ min: 3, max: 50 }),
  body('password').optional().isString().isLength({ min: 6 }),
  body('fullname').optional().isString().trim(),
  body('birthYear').optional().isInt({ min: 1900, max: 2100 }),
  body('role').isIn(['guest', 'member', 'admin']),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).render('users/edit', {
          values: { ...req.body, _id: req.params.id },
          errors: Object.fromEntries(errors.array().map((e) => [e.path, e.msg])),
          roles: ['guest', 'member', 'admin']
        });
      }

      const user = await Member.findById(req.params.id);
      if (!user) {
        return res.status(404).render('errors/404');
      }

      // Kiểm tra username đã tồn tại (trừ user hiện tại)
      const existingUser = await Member.findOne({ 
        username: req.body.username,
        _id: { $ne: req.params.id }
      });
      if (existingUser) {
        return res.status(400).render('users/edit', {
          values: { ...req.body, _id: req.params.id },
          errors: { username: 'Username already exists' },
          roles: ['guest', 'member', 'admin']
        });
      }

      // Cập nhật user
      const updateData = {
        username: req.body.username.trim(),
        fullname: req.body.fullname?.trim() || '',
        birthYear: req.body.birthYear ? parseInt(req.body.birthYear) : undefined,
        role: req.body.role
      };

      // Chỉ cập nhật password nếu có
      if (req.body.password) {
        updateData.password = await bcrypt.hash(req.body.password, 10);
      }

      await Member.findByIdAndUpdate(req.params.id, updateData);
      res.redirect('/view/users');
    } catch (err) {
      res.status(500).render('errors/500', { error: err.message });
    }
  }
);

// Xóa user (chỉ admin)
router.delete('/:id', requirePermission(PERMISSIONS.USERS.DELETE), async (req, res) => {
  try {
    // Không cho phép xóa chính mình
    if (req.params.id === req.session.member.id) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    const result = await Member.findByIdAndDelete(req.params.id);
    if (!result) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.redirect('/view/users');
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
