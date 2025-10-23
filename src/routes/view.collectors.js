const express = require('express');
const router = express.Router();
const Member = require('../models/Member');
const { ensureAuthenticated } = require('../middleware/authView');
const { requireRole, ROLES } = require('../middleware/authorize');

// GET /collectors - Admin only: List all members
router.get('/', ensureAuthenticated, requireRole(ROLES.ADMIN), async (req, res, next) => {
  try {
    const members = await Member.find({}, { password: 0 }) // Exclude password field
      .sort({ createdAt: -1 })
      .lean();
    
    res.render('collectors/index', { 
      members, 
      member: req.session.member 
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
