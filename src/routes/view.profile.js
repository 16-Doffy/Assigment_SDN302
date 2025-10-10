const express = require('express');
const router = express.Router();
const Member = require('../models/Member');
const { ensureAuthenticated } = require('../middleware/authView');

router.use(ensureAuthenticated);

router.get('/', async (req, res, next) => {
  try {
    const user = await Member.findById(req.user._id).lean();
    res.render('profile/index', { user, error: null });
  } catch (err) {
    next(err);
  }
});

// cập nhật fullname và birthYear
router.post('/edit', async (req, res, next) => {
  try {
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
      req.session.member.username = req.session.member.username; // keep
      req.session.member.fullname = update.fullname || req.session.member.fullname;
    }
    res.redirect('/profile');
  } catch (err) {
    next(err);
  }
});

module.exports = router;


