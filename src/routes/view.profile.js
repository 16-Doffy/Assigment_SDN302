const express = require('express');
const { body, validationResult } = require('express-validator');
const { ensureAuthenticated } = require('../middleware/authView');
const Member = require('../models/Member');

const router = express.Router();

router.use(ensureAuthenticated);

router.get('/', async (req, res) => {
  const m = await Member.findById(req.session.member.id);
  res.render('profile/index', { values: { fullName: m.fullName || '', birthYear: m.birthYear || '' }, errors: {} });
});

router.post(
  '/',
  body('fullName').isString().trim().notEmpty(),
  body('birthYear').isInt({ min: 1900, max: 2100 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).render('profile/index', {
        values: req.body,
        errors: Object.fromEntries(errors.array().map((e) => [e.path, e.msg])),
      });
    }
    await Member.findByIdAndUpdate(req.session.member.id, {
      $set: { fullName: req.body.fullName.trim(), birthYear: Number(req.body.birthYear) },
    });
    res.redirect('/profile');
  }
);

module.exports = router;


