const ROLES = Object.freeze({
  GUEST: 'guest',
  USER: 'user',
  ADMIN: 'admin'
});

/**
 * Middleware yêu cầu role.
 * Sử dụng: requireRole('admin') hoặc requireRole('member','admin') hoặc requireRole(['admin'])
 */
function requireRole(...roles) {
  if (roles.length === 1 && Array.isArray(roles[0])) roles = roles[0];
  return (req, res, next) => {
    const user = req.user;
    if (!user) {
      if (req.accepts('html')) return res.status(403).render('errors/403');
      return res.status(403).json({ message: 'Forbidden' });
    }
    if (roles.length && !roles.includes(user.role)) {
      if (req.accepts('html')) return res.status(403).render('errors/403');
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  };
}

module.exports = requireRole;
module.exports.requireRole = requireRole;
module.exports.ROLES = ROLES;


