/**
 * User Context Utilities
 * 
 * Manages user information in Express request context
 */

/**
 * User represents the authenticated user in the request context
 */
export class User {
  constructor() {
    this.userId = null;
    this.organization = null;
    this.isSystem = false;
    this.roles = [];        // List of role names/IDs
    this.permissions = [];  // Aggregated list of permissions from all roles
    this.phone = null;
    this.accountId = null;
    this.firstname = null;
    this.lastname = null;
    this.middlename = null;
    this.allowPinLogin = true;
    this.scopeLevel = null;
    this.scopeId = null;
    this.scopeSectorIds = null;
  }
}

/**
 * Organization represents organization information
 */
export class Organization {
  constructor() {
    this.id = null;
    this.name = null;
    this.tenantId = null;
  }
}

// Context keys
export const UserContextKey = 'user';
export const IgnoreOrganizationInterceptorKey = 'ignore_organization_interceptor';

/**
 * Get user from Express request
 * @param {Object} req - Express request object
 * @returns {User|null} User object or null
 */
export function getUser(req) {
  if (!req || !req[UserContextKey]) {
    return null;
  }
  return req[UserContextKey];
}

/**
 * Set user in Express request
 * @param {Object} req - Express request object
 * @param {User} user - User object
 */
export function setUser(req, user) {
  if (!req) return;
  req[UserContextKey] = user;
}

/**
 * Check if route should ignore organization interceptor
 * @param {Object} req - Express request object
 * @returns {boolean}
 */
export function shouldIgnoreOrganizationInterceptor(req) {
  if (!req) return false;
  return req[IgnoreOrganizationInterceptorKey] === true;
}

