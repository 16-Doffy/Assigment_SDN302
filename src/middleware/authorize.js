const { ROLES, PERMISSIONS, hasPermission, hasAnyPermission, hasAllPermissions } = require('../config/permissions');

/**
 * Middleware yêu cầu role.
 * Sử dụng: requireRole('admin') hoặc requireRole('member','admin') hoặc requireRole(['admin'])
 */
function requireRole(...roles) {
  if (roles.length === 1 && Array.isArray(roles[0])) roles = roles[0];
  return (req, res, next) => {
    // Ưu tiên role trong session (đã chuẩn hóa sau đăng nhập)
    const user = req.session?.member || req.user;
    if (!user) {
      if (req.accepts('html')) return res.redirect('/auth/signin');
      return res.status(403).json({ message: 'Forbidden' });
    }
    if (roles.length && !roles.includes(user.role)) {
      if (req.accepts('html')) return res.status(403).render('errors/403');
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  };
}

/**
 * Middleware yêu cầu permission cụ thể
 * Sử dụng: requirePermission('products:create')
 */
function requirePermission(permission) {
  return (req, res, next) => {
    // Ưu tiên role trong session (đã chuẩn hóa sau đăng nhập)
    const user = req.session?.member || req.user;
    if (!user) {
      if (req.accepts('html')) return res.redirect('/auth/signin');
      return res.status(403).json({ message: 'Forbidden' });
    }
    if (!hasPermission(user.role, permission)) {
      if (req.accepts('html')) return res.status(403).render('errors/403');
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  };
}

/**
 * Middleware yêu cầu một trong các permissions
 * Sử dụng: requireAnyPermission(['products:create', 'products:update'])
 */
function requireAnyPermission(permissions) {
  return (req, res, next) => {
    const user = req.user;
    if (!user) {
      if (req.accepts('html')) return res.status(403).render('errors/403');
      return res.status(403).json({ message: 'Forbidden' });
    }
    if (!hasAnyPermission(user.role, permissions)) {
      if (req.accepts('html')) return res.status(403).render('errors/403');
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  };
}

/**
 * Middleware yêu cầu tất cả permissions
 * Sử dụng: requireAllPermissions(['products:create', 'products:update'])
 */
function requireAllPermissions(permissions) {
  return (req, res, next) => {
    const user = req.user;
    if (!user) {
      if (req.accepts('html')) return res.status(403).render('errors/403');
      return res.status(403).json({ message: 'Forbidden' });
    }
    if (!hasAllPermissions(user.role, permissions)) {
      if (req.accepts('html')) return res.status(403).render('errors/403');
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  };
}

module.exports = requireRole;
module.exports.requireRole = requireRole;
module.exports.requirePermission = requirePermission;
module.exports.requireAnyPermission = requireAnyPermission;
module.exports.requireAllPermissions = requireAllPermissions;
module.exports.ROLES = ROLES;
module.exports.PERMISSIONS = PERMISSIONS;


