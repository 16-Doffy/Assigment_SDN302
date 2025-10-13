const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const Member = require('../models/Member');
const bcrypt = require('bcryptjs');
const { ensureAuthenticated } = require('../middleware/authView');
const { requireRole, ROLES } = require('../middleware/authorize');

router.use(ensureAuthenticated);

router.get('/', async (req, res, next) => {
  try {
    const userId = req.session?.member?.id || (req.user && req.user._id);
    if (!userId) return res.redirect('/auth/signin');
    const user = await Member.findById(userId).lean();
    return res.render('profile/index', { user, error: null, member: req.session.member });
  } catch (err) {
    next(err);
  }
});

// Change password form
router.get('/change-password', async (req, res) => {
  return res.render('profile/change-password', { error: null, member: req.session.member });
});

// Handle change password
router.post('/change-password', async (req, res) => {
  try {
    const userId = req.session?.member?.id || (req.user && req.user._id);
    const user = await Member.findById(userId);
    if (!user) return res.redirect('/auth/signin');
    const { currentPassword, newPassword } = req.body;
    const ok = await bcrypt.compare(currentPassword, user.password);
    if (!ok) return res.render('profile/change-password', { error: 'Mật khẩu hiện tại không đúng', member: req.session.member });
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    return res.redirect('/profile');
  } catch (e) {
    return res.render('profile/change-password', { error: 'Không thể đổi mật khẩu', member: req.session.member });
  }
});
// cập nhật fullname và birthYear (chỉ member và admin)
router.post('/edit', 
  // accept both new 'user' and legacy 'member' roles
  requireRole(ROLES.USER, 'member', ROLES.ADMIN),
  body('fullname').optional().isString().trim().isLength({ min: 2, max: 100 }),
  body('birthYear').optional().isInt({ min: 1900, max: 2100 }),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      const userId = req.session?.member?.id || (req.user && req.user._id);
      if (!userId) return res.redirect('/auth/signin');

      if (!errors.isEmpty()) {
        const user = await Member.findById(userId).lean();
        return res.render('profile/index', {
          user,
          error: 'Dữ liệu không hợp lệ',
          errors: errors.array(),
          member: req.session.member
        });
      }

      const { fullname, birthYear } = req.body;
      const update = {};
      if (typeof fullname === 'string') update.fullname = fullname.trim();
      if (birthYear !== undefined && birthYear !== null && birthYear !== '') {
        const y = parseInt(birthYear, 10);
        if (!isNaN(y)) update.birthYear = y;
      }

      const updated = await Member.findByIdAndUpdate(
        userId,
        { $set: update },
        { new: true, runValidators: true }
      );

      if (!updated) {
        const user = await Member.findById(userId).lean();
        return res.status(400).render('profile/index', {
          user,
          error: 'Không thể cập nhật hồ sơ. Vui lòng thử lại.',
          member: req.session.member
        });
      }

      // cập nhật session.member nếu có
      if (req.session && req.session.member && updated) {
        req.session.member.fullname = updated.fullname ?? req.session.member.fullname;
        req.session.member.birthYear = updated.birthYear ?? req.session.member.birthYear;
        req.session.member.role = updated.role;
      }

      return res.redirect('/profile');
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;



