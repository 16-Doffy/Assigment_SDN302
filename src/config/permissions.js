const ROLES = Object.freeze({
  GUEST: 'guest',
  USER: 'user',
  ADMIN: 'admin'
});

// Định nghĩa quyền cho từng role
const PERMISSIONS = Object.freeze({
  // Product permissions
  PRODUCTS: {
    VIEW: 'products:view',
    CREATE: 'products:create',
    UPDATE: 'products:update',
    DELETE: 'products:delete'
  },
  
  // Section permissions
  SECTIONS: {
    VIEW: 'sections:view',
    CREATE: 'sections:create',
    UPDATE: 'sections:update',
    DELETE: 'sections:delete'
  },
  
  // Course permissions
  COURSES: {
    VIEW: 'courses:view',
    CREATE: 'courses:create',
    UPDATE: 'courses:update',
    DELETE: 'courses:delete'
  },
  
  // Feedback permissions
  FEEDBACK: {
    VIEW: 'feedback:view',
    CREATE: 'feedback:create',
    UPDATE: 'feedback:update',
    DELETE: 'feedback:delete'
  },
  
  // User management permissions
  USERS: {
    VIEW: 'users:view',
    CREATE: 'users:create',
    UPDATE: 'users:update',
    DELETE: 'users:delete'
  }
});

// Mapping role với permissions
const ROLE_PERMISSIONS = {
  [ROLES.GUEST]: [
    PERMISSIONS.PRODUCTS.VIEW,
    PERMISSIONS.SECTIONS.VIEW,
    PERMISSIONS.COURSES.VIEW,
    PERMISSIONS.FEEDBACK.VIEW
  ],
  
  [ROLES.USER]: [
    PERMISSIONS.PRODUCTS.VIEW,
    PERMISSIONS.SECTIONS.VIEW,
    PERMISSIONS.COURSES.VIEW,
    PERMISSIONS.FEEDBACK.VIEW,
    PERMISSIONS.FEEDBACK.CREATE,
    PERMISSIONS.FEEDBACK.UPDATE,
    PERMISSIONS.FEEDBACK.DELETE
  ],
  
  [ROLES.ADMIN]: [
    // Admin có tất cả quyền
    ...Object.values(PERMISSIONS.PRODUCTS),
    ...Object.values(PERMISSIONS.SECTIONS),
    ...Object.values(PERMISSIONS.COURSES),
    ...Object.values(PERMISSIONS.FEEDBACK),
    ...Object.values(PERMISSIONS.USERS)
  ]
};

// Helper functions
function hasPermission(userRole, permission) {
  const userPermissions = ROLE_PERMISSIONS[userRole] || [];
  return userPermissions.includes(permission);
}

function hasAnyPermission(userRole, permissions) {
  return permissions.some(permission => hasPermission(userRole, permission));
}

function hasAllPermissions(userRole, permissions) {
  return permissions.every(permission => hasPermission(userRole, permission));
}

function getUserPermissions(userRole) {
  return ROLE_PERMISSIONS[userRole] || [];
}

module.exports = {
  ROLES,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getUserPermissions
};
