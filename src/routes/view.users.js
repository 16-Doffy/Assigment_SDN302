const express = require('express');
const { body, param, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const { ensureAuthenticated } = require('../middleware/authView');
const { requirePermission, requireRole, PERMISSIONS } = require('../middleware/authorize');
const Member = require('../models/Member');

const router = express.Router();

// Tất cả routes đều cần authentication và phải là admin
router.use(ensureAuthenticated);
router.use(requireRole('admin'));

// Danh sách users (chỉ admin)
router.get('/', requirePermission(PERMISSIONS.USERS.VIEW), async (req, res) => {
  try {
    const users = await Member.find().select('-password').sort({ createdAt: -1 });
    res.render('users/index', { users, member: req.session.member });
  } catch (err) {
    res.status(500).render('errors/500', { error: err.message });
  }
});

// Theo đề: Admin chỉ được XEM danh sách thành viên; không được thêm/sửa/xóa hồ sơ người khác

module.exports = router;
