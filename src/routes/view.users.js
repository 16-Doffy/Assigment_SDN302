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

// Theo đề: Admin chỉ xem danh sách Members, không tạo/sửa/xóa
router.get('/new', (req, res) => {
  return res.status(403).render('errors/403');
});

// Tạo user mới (chỉ admin)
router.post('/new', (req, res) => res.status(403).render('errors/403'));

// Form chỉnh sửa user (chỉ admin)
router.get('/:id/edit', (req, res) => res.status(403).render('errors/403'));

// Cập nhật user (chỉ admin)
router.put('/:id', (req, res) => res.status(403).render('errors/403'));

// Xóa user (chỉ admin)
router.delete('/:id', (req, res) => res.status(403).render('errors/403'));

module.exports = router;
