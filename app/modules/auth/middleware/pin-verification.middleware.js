import { HttpError } from '../../../shared/utils/http-error.js';
import { verifyPin } from '../utils/pin.util.js';
import { pinRateLimiter } from '../utils/pin-rate-limiter.js';
import { decryptPin, isEncrypted } from '../utils/pin-encryption.util.js';
import { models } from '../../../shared/db/data-source.js';
import { logger } from '../../../shared/logger/logger.js';

/**
 * Route middleware for PIN verification
 * Requires: authMiddleware() to be applied first (for organization context)
 * Validates PIN for a specific user and injects verified user info into req.verifiedUser
 * 
 * Usage:
 * router.post('/sales', 
 *   authMiddleware(), 
 *   pinVerificationMiddleware(), 
 *   controller.createSale
 * )
 * 
 * Request body/header must include:
 * - userId: UUID of the user to verify
 * - pin: 4-6 digit PIN
 */
export function pinVerificationMiddleware() {
  return async (req, res, next) => {
    try {
      const user = req.user;
      if (!user || !user.organization) {
        throw new HttpError(401, 'UNAUTHORIZED', 'Authentication required');
      }

      const organizationId = user.organization.id;

      // Get userId and PIN from request body or header
      const userId = req.headers['x-user-id'];
      let pin = req.headers['x-pin'];

      if (!userId) {
        throw new HttpError(
          400,
          'USER_ID_REQUIRED',
          'userId is required in x-user-id header'
        );
      }

      if (!pin) {
        throw new HttpError(
          400,
          'PIN_REQUIRED',
          'PIN is required in x-pin header'
        );
      }

      // Decrypt PIN if it's encrypted (frontend sends encrypted PIN)
      // if (isEncrypted(pin)) {
      try {
        pin = decryptPin(pin); // Uses timeout from env config
        logger.debug('PIN decrypted successfully');
      } catch (error) {
        logger.error('Failed to decrypt PIN', { error: error.message });
        if (error.message.includes('expired')) {
          throw new HttpError(400, 'PIN_EXPIRED', error.message);
        }
        throw new HttpError(
          400,
          'INVALID_ENCRYPTED_PIN',
          'Invalid encrypted PIN format'
        );
      }
      // }

      // Validate PIN format (after decryption)
      if (typeof pin !== 'string' || !/^\d{4,6}$/.test(pin)) {
        throw new HttpError(400, 'VALIDATION_ERROR', 'PIN must be 4-6 digits');
      }

      // Use userId for rate limiting
      const rateLimitKey = userId;

      // Check rate limiting
      if (pinRateLimiter.isRateLimited(rateLimitKey)) {
        const resetTime = pinRateLimiter.getResetTime(rateLimitKey);
        throw new HttpError(
          429,
          'RATE_LIMIT_EXCEEDED',
          `Too many PIN attempts. Please try again after ${
            resetTime ? resetTime.toISOString() : '15 minutes'
          }.`
        );
      }

      // Find user by userId in organization
      const targetUser = await models.User.findOne({
        where: {
          id: userId,
          organizationId,
          isActive: true,
        },
        attributes: [
          'id',
          'phone',
          'pinHash',
          'isActive',
          'organizationId',
          'allowPinLogin',
        ],
      });

      if (!targetUser) {
        // Record failed attempt (even if user not found, to prevent user enumeration)
        pinRateLimiter.recordAttempt(rateLimitKey);
        const remaining = pinRateLimiter.getRemainingAttempts(rateLimitKey);

        logger.warn(
          `Failed PIN attempt for user: ${userId} in organization: ${organizationId} - User not found or inactive`,
          {
            userId,
            organizationId,
            remainingAttempts: remaining,
          }
        );

        throw new HttpError(
          401,
          'INVALID_PIN',
          `Invalid PIN. ${remaining} attempt(s) remaining.`
        );
      }

      // Check if PIN login is allowed for this user
      if (targetUser.allowPinLogin === false) {
        pinRateLimiter.recordAttempt(rateLimitKey);
        const remaining = pinRateLimiter.getRemainingAttempts(rateLimitKey);

        logger.warn(
          `PIN login attempt blocked for user: ${userId} - PIN login is disabled`,
          {
            userId,
            organizationId,
            remainingAttempts: remaining,
          }
        );

        throw new HttpError(
          403,
          'PIN_LOGIN_DISABLED',
          `PIN login is disabled for this user. ${remaining} attempt(s) remaining.`
        );
      }

      // Check if user has PIN set
      if (!targetUser.pinHash) {
        pinRateLimiter.recordAttempt(rateLimitKey);
        const remaining = pinRateLimiter.getRemainingAttempts(rateLimitKey);

        logger.warn(`Failed PIN attempt for user: ${userId} - PIN not set`, {
          userId,
          organizationId,
          remainingAttempts: remaining,
        });

        throw new HttpError(
          400,
          'PIN_NOT_SET',
          `User does not have a PIN set. ${remaining} attempt(s) remaining.`
        );
      }

      // Verify PIN for this specific user
      const isValidPin = await verifyPin(pin, targetUser.pinHash);

      if (!isValidPin) {
        // Record failed attempt
        pinRateLimiter.recordAttempt(rateLimitKey);
        const remaining = pinRateLimiter.getRemainingAttempts(rateLimitKey);

        logger.warn(
          `Failed PIN attempt for user: ${userId} in organization: ${organizationId}`,
          {
            userId,
            organizationId,
            remainingAttempts: remaining,
          }
        );

        throw new HttpError(
          401,
          'INVALID_PIN',
          `Invalid PIN. ${remaining} attempt(s) remaining.`
        );
      }

      // Reset rate limiter on success
      pinRateLimiter.resetAttempts(rateLimitKey);

      // Inject verified user info into request
      req.verifiedUser = {
        userId: targetUser.id,
        phone: targetUser.phone,
        organizationId: targetUser.organizationId,
      };

      logger.info(
        `PIN verified successfully for user: ${targetUser.id} in organization: ${organizationId}`
      );

      next();
    } catch (error) {
      next(error);
    }
  };
}

