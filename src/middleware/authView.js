const Member = require('../models/Member');

/**
 * Gắn user vào req.user nếu session có userId hoặc session.member
 */

async function attachUser(req, res, next) {
  try {
    const idFromSession = req.session && (req.session.userId || (req.session.member && req.session.member.id));
    if (idFromSession) {
      const user = await Member.findById(idFromSession).lean();
      // Treat 'guest' as NOT authenticated
      if (user && user.role === 'guest') {
        req.user = null;
        // Clear any stale guest session
        if (req.session && req.session.member && req.session.member.role === 'guest') {
          delete req.session.userId;
          delete req.session.member;
        }
      } else {
        req.user = user || null;
      }
      // đảm bảo session.member luôn có thông tin cơ bản
      if (user && user.role !== 'guest' && !req.session.member) {
        req.session.member = { id: user._id.toString(), username: user.username, role: user.role };
      }
    } else {
      req.user = null;
    }
  } catch (err) {
    req.user = null;
  }
  next();
}

function ensureAuthenticated(req, res, next) {
  if (req.user || (req.session && req.session.member)) return next();
  // nếu là request HTML chuyển hướng tới trang đăng nhập
  if (req.accepts('html')) return res.redirect('/auth/signin');
  return res.status(401).json({ message: 'Unauthorized' });
}

function ensureGuest(req, res, next) {
  if (!req.user) return next();
  if (req.accepts('html')) return res.redirect('/products');
  return res.status(400).json({ message: 'Already authenticated' });
}

module.exports = {
  attachUser,
  ensureAuthenticated,
  ensureGuest
};


