const express = require('express');
const { ensureAuthenticated } = require('../middleware/authView');
const { requirePermission, PERMISSIONS } = require('../middleware/authorize');
const Member = require('../models/Member');
const Product = require('../models/Product');
const Section = require('../models/Section');
const Course = require('../models/Course');
const Feedback = require('../models/Feedback');

const router = express.Router();

// Dashboard chính
router.get('/', ensureAuthenticated, async (req, res) => {
  try {
    // Sử dụng req.session.member thay vì req.user
    const user = req.session.member;
    if (!user) {
      return res.redirect('/auth/signin');
    }
    
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

    // Thống kê cho member
    if (user.role === 'member') {
      // Cần lấy _id từ database
      const memberDoc = await Member.findById(user.id);
      if (memberDoc) {
        stats.myFeedbacks = await Feedback.countDocuments({ member: memberDoc._id });
        stats.recentFeedbacks = await Feedback.find({ member: memberDoc._id })
          .populate('product', 'name')
          .sort({ createdAt: -1 })
          .limit(5)
          .lean();
      }
    }

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
