/**
 * Authorization Error Classes
 * 
 * Provides structured error handling for authorization failures
 */

import { HttpError } from '../../../shared/utils/http-error.js';

/**
 * AuthorizationError represents an authorization-related error
 */
export class AuthorizationError extends HttpError {
  constructor(code, message, details = {}) {
    super(403, code, message, details);
    this.name = 'AuthorizationError';
  }
}

// Predefined authorization error codes
export const ErrorCodes = {
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  SCOPE_RESOLUTION_FAILED: 'SCOPE_RESOLUTION_FAILED',
  ROLE_LOAD_FAILED: 'ROLE_LOAD_FAILED',
};

/**
 * Creates a new authorization error
 */
export function newAuthorizationError(code, message, details = {}) {
  return new AuthorizationError(code, message, details);
}

