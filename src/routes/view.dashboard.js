const express = require('express');
const { ensureAuthenticated } = require('../middleware/authView');
const { requirePermission, PERMISSIONS, requireRole } = require('../middleware/authorize');
const Member = require('../models/Member');
const Product = require('../models/Product');
const Section = require('../models/Section');
const Course = require('../models/Course');
const Feedback = require('../models/Feedback');

const router = express.Router();

// Dashboard chính
router.get('/', ensureAuthenticated, requireRole('admin'), async (req, res) => {
  try {
    const user = req.session.member;
    
    let stats = {};

    // Thống kê cơ bản cho tất cả users
    stats.totalProducts = await Product.countDocuments();
    stats.totalSections = await Section.countDocuments();
    stats.totalCourses = await Course.countDocuments();
    stats.totalFeedbacks = await Feedback.countDocuments();

    // Thống kê chi tiết cho admin
    if (user.role === 'admin') {
      stats.totalUsers = await Member.countDocuments();
      stats.usersByRole = await Member.aggregate([
        { $group: { _id: '$role', count: { $sum: 1 } } } 
      ]);
      
      // Recent activities
      stats.recentUsers = await Member.find()
        .select('username role createdAt')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean();
      
      stats.recentProducts = await Product.find()
        .populate('createdBy', 'username')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean();
    }

    // Dashboard chỉ dành cho admin → bỏ phần thống kê theo member

    res.render('dashboard/index', { 
      user, 
      stats, 
      member: req.session.member
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).render('errors/500', { error: err.message });
  }
});

module.exports = router;
