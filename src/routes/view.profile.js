const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const Member = require('../models/Member');
const { ensureAuthenticated } = require('../middleware/authView');
const { requireRole, ROLES } = require('../middleware/authorize');

router.use(ensureAuthenticated);

router.get('/', async (req, res, next) => {
  try {
    const user = await Member.findById(req.user._id).lean();
    res.render('profile/index', { user, error: null });
  } catch (err) {
    next(err);
  }
});

// cập nhật fullname và birthYear (chỉ member và admin)
router.post('/edit', 
  requireRole(ROLES.MEMBER, ROLES.ADMIN),
  body('fullname').optional().isString().trim().isLength({ min: 2, max: 100 }),
  body('birthYear').optional().isInt({ min: 1900, max: 2100 }),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const user = await Member.findById(req.user._id).lean();
        return res.render('profile/index', { 
          user, 
          error: 'Dữ liệu không hợp lệ',
          errors: errors.array()
        });
      }

      const { fullname, birthYear } = req.body;
      const update = {};
      if (typeof fullname === 'string') update.fullname = fullname.trim();
      if (birthYear) {
        const y = parseInt(birthYear, 10);
        if (!isNaN(y)) update.birthYear = y;
      }
      
      await Member.findByIdAndUpdate(req.user._id, update);
      
      // cập nhật session.member nếu có
      if (req.session && req.session.member) {
        req.session.member.fullname = update.fullname || req.session.member.fullname;
      }
      
      res.redirect('/profile');
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;


