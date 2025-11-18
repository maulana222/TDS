import { getUserRoleNames } from '../models/roleModel.js';

/**
 * Middleware untuk require specific role
 * @param {string|Array<string>} requiredRoles - Role atau array of roles yang diizinkan
 */
export const requireRole = (requiredRoles) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
      }

      const userRoles = await getUserRoleNames(req.user.id);
      
      // Admin selalu memiliki akses penuh
      if (userRoles.includes('admin')) {
        return next();
      }

      // Convert single role to array
      const rolesArray = Array.isArray(requiredRoles) 
        ? requiredRoles 
        : [requiredRoles];

      // Check if user has any of the required roles
      const hasRequiredRole = rolesArray.some(role => userRoles.includes(role));

      if (!hasRequiredRole) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: Insufficient permissions'
        });
      }

      // Attach user roles to request for use in controllers
      req.user.roles = userRoles;
      
      next();
    } catch (error) {
      console.error('Error in requireRole middleware:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };
};

/**
 * Middleware untuk require any of multiple roles
 * @param {Array<string>} roles - Array of roles
 */
export const requireAnyRole = (roles) => {
  return requireRole(roles);
};

/**
 * Middleware untuk require all roles
 * @param {Array<string>} requiredRoles - Array of roles yang semua harus dimiliki
 */
export const requireAllRoles = (requiredRoles) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
      }

      const userRoles = await getUserRoleNames(req.user.id);
      
      // Admin selalu memiliki akses penuh
      if (userRoles.includes('admin')) {
        return next();
      }

      // Check if user has ALL required roles
      const hasAllRoles = requiredRoles.every(role => userRoles.includes(role));

      if (!hasAllRoles) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: Insufficient permissions'
        });
      }

      req.user.roles = userRoles;
      next();
    } catch (error) {
      console.error('Error in requireAllRoles middleware:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };
};

/**
 * Check if user has permission based on role permissions
 * @param {string} permission - Permission yang diperlukan (e.g., "transactions:read")
 */
export const requirePermission = (permission) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
      }

      const { getUserRoles } = await import('../models/roleModel.js');
      const userRoles = await getUserRoles(req.user.id);
      
      // Admin dengan permission "*" memiliki akses penuh
      const isAdmin = userRoles.some(role => role.name === 'admin');
      if (isAdmin) {
        return next();
      }

      // Check if any role has the required permission
      let hasPermission = false;
      
      for (const role of userRoles) {
        const permissions = role.permissions ? JSON.parse(role.permissions) : [];
        
        // Check for wildcard permission
        if (permissions.includes('*')) {
          hasPermission = true;
          break;
        }
        
        // Check for exact permission
        if (permissions.includes(permission)) {
          hasPermission = true;
          break;
        }
        
        // Check for wildcard pattern (e.g., "transactions:*" matches "transactions:read")
        const permissionParts = permission.split(':');
        if (permissionParts.length === 2) {
          const wildcardPermission = `${permissionParts[0]}:*`;
          if (permissions.includes(wildcardPermission)) {
            hasPermission = true;
            break;
          }
        }
      }

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: Insufficient permissions'
        });
      }

      req.user.roles = userRoles.map(r => r.name);
      next();
    } catch (error) {
      console.error('Error in requirePermission middleware:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };
};

