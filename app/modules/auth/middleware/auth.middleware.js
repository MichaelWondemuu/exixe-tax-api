/**
 * Authentication Middleware
 * 
 * Validates JWT tokens and extracts user information from various sources:
 * - JWT Bearer token
 * - x-api-key header (for service-to-service)
 * - x-user-key header (for user ID override)
 * - x-user-roles header (for role override)
 * - x-organization-id header (for organization override)
 */

import { validateToken, extractTokenFromHeader } from './jwt.js';
import { getUser, setUser, User, Organization } from './user-context.js';
import { logger } from '../../../shared/logger/logger.js';
import { HttpError } from '../../../shared/utils/http-error.js';
import { matchesRoutePattern, ANONYMOUS_KEY } from '../../../shared/decorators/route-metadata.js';
import { models } from '../../../shared/db/data-source.js';
import { Op } from 'sequelize';

// Context keys for repository hooks
const ContextKeys = {
  USER_ID: 'userId',
  ACCOUNT_ID: 'accountId',
  ORGANIZATION_ID: 'organizationId',
  ORGANIZATION_NAME: 'organizationName',
  IS_SYSTEM: 'isSystem',
};

/**
 * Authentication middleware
 * Extracts and validates user information from request headers
 */
export function authMiddleware() {
  return async (req, res, next) => {
    try {
      // Check if route is anonymous - skip authentication if so
      const fullPath = req.baseUrl + req.path;
      if (
        matchesRoutePattern(req.method, fullPath, ANONYMOUS_KEY) ||
        matchesRoutePattern(req.method, req.path, ANONYMOUS_KEY)
      ) {
        return next();
      }

      // Check for API key (service-to-service authentication)
      const apiKey = req.headers['x-api-key'];
      if (apiKey) {
        // TODO: Validate API key and fetch organization
        // For now, allow through
        return next();
      }

      // Check for JWT Bearer token
      const authHeader =
        req.headers?.authorization || req.headers?.Authorization;
      if (authHeader) {
        try {
          const tokenString = extractTokenFromHeader(req);
          const claims = validateToken(tokenString);

          if (claims) {
            // Instant logout: block access tokens present in the revocation denylist.
            // If a token doesn't have `jti` (older tokens), we can't revoke it reliably.
            if (claims.jti) {
              const revoked = await models.TokenRevocation.findOne({
                where: {
                  tokenType: 'access',
                  jti: claims.jti,
                  expiresAt: { [Op.gt]: new Date() },
                },
                attributes: ['id'],
              });

              if (revoked) {
                return next(
                  new HttpError(401, 'TOKEN_REVOKED', 'Token revoked'),
                );
              }
            }

            const user = new User();
            user.userId = claims.userId;
            user.roles = claims.roles || [];
            user.permissions = claims.permissions || [];
            user.isSystem = claims.isSystem || false;
            user.phone = claims.phone || null;
            user.accountId = claims.accountId || null;
            user.firstname = claims.firstname || null;
            user.lastname = claims.lastname || null;
            user.middlename = claims.middlename || null;
            user.allowPinLogin =
              claims.allowPinLogin !== undefined ? claims.allowPinLogin : true;
            user.scopeLevel = claims.scopeLevel || null;
            user.scopeId = claims.scopeId || null;
            user.scopeSectorIds = Array.isArray(claims.scopeSectorIds) ? claims.scopeSectorIds : null;

            if (claims.organizationId) {
              user.organization = new Organization();
              user.organization.id = claims.organizationId;
              user.organization.name = claims.organizationName || null;
            }

            setUser(req, user);

            // Provide logout with the access token identifiers (jti/exp).
            req.authToken = {
              tokenType: 'access',
              jti: claims.jti || null,
              exp: claims.exp || null,
            };

            // logger.debug('JWT token validated and user set', {
            //   userId: user.userId,
            //   organizationId: user.organization?.id,
            // });
          }
        } catch (error) {
          // Token validation failed - log the error for debugging
          logger.warn('JWT token validation failed', {
            error: error.message,
            errorName: error.name,
            path: req.path,
            method: req.method,
          });

          // If token is expired or invalid, stop execution and pass error to error middleware
          if (error.message === 'Token expired') {
            return next(new HttpError(401, 'TOKEN_EXPIRED', 'Token expired'));
          }
          if (error.message === 'Invalid token') {
            return next(new HttpError(401, 'INVALID_TOKEN', 'Invalid token'));
          }
          if (error.message === 'Authorization header missing') {
            return next(
              new HttpError(
                401,
                'UNAUTHORIZED',
                'Authorization header missing',
              ),
            );
          }
          if (error.message === 'Invalid authorization header format') {
            return next(
              new HttpError(
                401,
                'UNAUTHORIZED',
                'Invalid authorization header format',
              ),
            );
          }
          if (
            typeof error.message === 'string' &&
            error.message.includes('JWT secret is not configured')
          ) {
            return next(
              new HttpError(
                503,
                'AUTH_MISCONFIGURED',
                'JWT is not configured on the server (JWT_SECRET / APP_AUTH_TOKEN).',
              ),
            );
          }

          // For other errors, continue to check other auth methods (headers, etc.)
          // Don't fail here, allow other auth methods
        }
      }

      // Check for user ID header override
      const userIDStr = req.headers['x-user-key'];
      if (userIDStr) {
        const user = getUser(req) || new User();
        user.userId = userIDStr; // UUID string
        setUser(req, user);
      }

      // Check for organization ID header override
      const orgIDStr = req.headers['x-organization-id'];
      if (orgIDStr) {
        const user = getUser(req) || new User();
        if (!user.organization) {
          user.organization = new Organization();
        }
        user.organization.id = orgIDStr; // UUID string
        setUser(req, user);
      }

      // Inject user information into request context for repositories
      const user = getUser(req);
      if (user) {
        // Set context values for repository hooks and filters
        if (user.userId) {
          req[ContextKeys.USER_ID] = user.userId;
        }
        req[ContextKeys.IS_SYSTEM] = user.isSystem;
        req[ContextKeys.ACCOUNT_ID] = user.accountId;

        if (user.organization) {
          req[ContextKeys.ORGANIZATION_ID] = user.organization.id;
          if (user.organization.name) {
            req[ContextKeys.ORGANIZATION_NAME] = user.organization.name;
          }
        }
      } else {
        return next(
          new HttpError(
            401,
            'UNAUTHORIZED',
            'Authentication required. Send a valid Authorization: Bearer <access_token> header (or x-user-key where permitted).',
          ),
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

