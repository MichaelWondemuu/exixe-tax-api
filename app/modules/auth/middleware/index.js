/**
 * Auth Middleware Index
 * 
 * Central export point for all authentication and authorization middleware
 */

export { authMiddleware } from './auth.middleware.js';
export {
  generateToken,
  validateToken,
  generateRefreshToken,
  validateRefreshToken,
  extractTokenFromHeader,
  initJWT,
} from './jwt.js';
export { getUser, setUser, User, Organization } from './user-context.js';
export {
  AuthorizationError,
  ErrorCodes,
  newAuthorizationError,
} from './authorization-errors.js';
export { pinVerificationMiddleware } from './pin-verification.middleware.js';

// Import locally for use in functions
import { getUser } from './user-context.js';
import { AuthorizationError } from './authorization-errors.js';

/**
 * Simple permission middleware - checks if user has required permission
 * Supports multiple ways to specify permissions:
 * - requirePermission('role:li') - single permission
 * - requirePermission('role:li', 'role:ma') - multiple permissions as arguments (OR logic)
 * - requirePermission(['role:li', 'role:ma']) - array of permissions (OR logic)
 * 
 * @param {string|string[]} permissions - Single permission, array of permissions, or multiple permission arguments (OR logic)
 * @param {...string} additionalPermissions - Additional permissions (if first arg is not an array)
 * @returns {Function} Express middleware
 */
export function requirePermission(permissions, ...additionalPermissions) {
  return (req, res, next) => {
    const user = getUser(req);
    if (!user) {
      return next(
        new AuthorizationError('UNAUTHORIZED', 'User not authenticated')
      );
    }

    // Normalize permissions: handle both array and multiple arguments
    let requiredPerms;
    if (Array.isArray(permissions)) {
      // If first argument is an array, use it directly
      requiredPerms = permissions;
    } else {
      // If first argument is a string, combine with additional arguments
      requiredPerms = [permissions, ...additionalPermissions].filter(Boolean);
    }

    const userPerms = user.permissions || [];

    // Check if user has any of the required permissions (OR logic)
    const hasPermission = requiredPerms.some((perm) =>
      userPerms.some(
        (userPerm) => userPerm.toLowerCase() === perm.toLowerCase()
      )
    );

    if (!hasPermission) {
      return next(
        new AuthorizationError(
          'FORBIDDEN',
          `Insufficient permissions. Required: ${requiredPerms.join(' or ')}`
        )
      );
    }

    next();
  };
}

/**
 * Require system user middleware
 * @returns {Function} Express middleware
 */
export function requireSystemUser() {
  return (req, res, next) => {
    const user = getUser(req);
    if (!user || !user.isSystem) {
      return next(new AuthorizationError('FORBIDDEN', 'System user required'));
    }
    next();
  };
}

