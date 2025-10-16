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

// Theo yêu cầu mới: Admin có thể chỉnh sửa và xóa người dùng

// Form chỉnh sửa user (ADMIN)
router.get(
  '/:id/edit',
  requireRole('admin'),
  param('id').isMongoId(),
  async (req, res) => {
    const errorsResult = validationResult(req);
    if (!errorsResult.isEmpty()) {
      return res.status(400).render('errors/500', { error: 'ID không hợp lệ' });
    }
    try {
      const user = await Member.findById(req.params.id).select('-password');
      if (!user) return res.status(404).render('errors/404');
      const roles = ['guest', 'user', 'admin'];
      res.render('users/edit', {
        values: {
          _id: user._id,
          username: user.username,
          fullname: user.fullname || '',
          birthYear: user.birthYear || '',
          role: user.role
        },
        roles,
        errors: {},
        member: req.session.member
      });
    } catch (err) {
      res.status(500).render('errors/500', { error: err.message });
    }
  }
);

// Cập nhật user (ADMIN)
router.put(
  '/:id',
  requireRole('admin'),
  [
    param('id').isMongoId(),
    body('username').trim().notEmpty().withMessage('Username là bắt buộc'),
    body('fullname').optional({ checkFalsy: true }).trim().isLength({ max: 100 }).withMessage('Họ tên tối đa 100 ký tự'),
    body('birthYear').optional({ checkFalsy: true }).isInt({ min: 1900, max: 2100 }).withMessage('Năm sinh không hợp lệ'),
    body('role').isIn(['guest', 'user', 'admin']).withMessage('Role không hợp lệ')
  ],
  async (req, res) => {
    const result = validationResult(req);
    const roles = ['guest', 'user', 'admin'];
    const values = {
      _id: req.params.id,
      username: req.body.username,
      fullname: req.body.fullname || '',
      birthYear: req.body.birthYear || '',
      role: req.body.role
    };
    if (!result.isEmpty()) {
      const mapped = result.mapped();
      return res.status(400).render('users/edit', { values, roles, errors: Object.fromEntries(Object.entries(mapped).map(([k,v])=>[k,v.msg])), member: req.session.member });
    }
    try {
      const update = {
        username: req.body.username,
        fullname: req.body.fullname || undefined,
        role: req.body.role
      };
      if (req.body.birthYear) update.birthYear = parseInt(req.body.birthYear, 10);
      // Theo yêu cầu: Admin không được phép thay đổi mật khẩu của người dùng
      // Không cho admin tự đổi role hoặc xóa chính mình trong route này (an toàn)
      const isSelf = req.session?.member?.id === req.params.id;
      if (isSelf && req.body.role !== req.session.member.role) {
        return res.status(400).render('users/edit', { values, roles, errors: { role: 'Không thể đổi role của chính bạn' }, member: req.session.member });
      }
      await Member.findByIdAndUpdate(req.params.id, update, { runValidators: true });
      res.redirect('/view/users');
    } catch (err) {
      res.status(500).render('users/edit', { values, roles, errors: { username: err.message }, member: req.session.member });
    }
  }
);

// Xóa user (ADMIN)
router.delete(
  '/:id',
  requireRole('admin'),
  param('id').isMongoId(),
  async (req, res) => {
    const errorsResult = validationResult(req);
    if (!errorsResult.isEmpty()) {
      return res.status(400).json({ message: 'ID không hợp lệ' });
    }
    try {
      // Không cho tự xóa chính mình
      if (req.session?.member?.id === req.params.id) {
        return res.status(400).json({ message: 'Bạn không thể tự xóa chính mình' });
      }
      await Member.findByIdAndDelete(req.params.id);
      return res.status(204).send();
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }
);

module.exports = router;
