import { HttpError } from '../../../../shared/utils/http-error.js';
import { verifyPin, hashPin } from '../../utils/pin.util.js';
import { decryptPin, isEncrypted } from '../../utils/pin-encryption.util.js';
import { pinRateLimiter } from '../../utils/pin-rate-limiter.js';
import { models } from '../../../../shared/db/data-source.js';
import { logger } from '../../../../shared/logger/logger.js';

export class PinAuthService {
  constructor({ userRepository }) {
    this.userRepository = userRepository;
  }

  /**
   * Verify PIN for a specific user in an organization
   * @param {Object} req - Express request object (must have organizationId from auth middleware)
   * @param {string} userId - User ID to verify PIN for
   * @param {string} pin - PIN to verify
   * @returns {Promise<Object>} User information if PIN is valid
   */
  verifyPin = async (req, userId, pin) => {
    const user = req.user;
    if (!user || !user.organization) {
      throw new HttpError(401, 'UNAUTHORIZED', 'Authentication required');
    }

    const organizationId = user.organization.id;

    if (!userId) {
      throw new HttpError(400, 'USER_ID_REQUIRED', 'userId is required');
    }

    // Decrypt PIN if it's encrypted (frontend sends encrypted PIN)
    if (isEncrypted(pin)) {
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
    }

    // Validate PIN format (after decryption)
    if (!pin || typeof pin !== 'string' || !/^\d{4,6}$/.test(pin)) {
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
        'firstname',
        'lastname',
        'middlename',
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

    logger.info(
      `PIN verified successfully for user: ${targetUser.id} in organization: ${organizationId}`
    );

    // Return user info (without sensitive data)
    return {
      message: 'PIN verified successfully',
      data: {
        userId: targetUser.id,
        phone: targetUser.phone,
        firstname: targetUser.firstname,
        lastname: targetUser.lastname,
        middlename: targetUser.middlename,
      },
    };
  };

  /**
   * Set or update PIN for a user
   * @param {Object} req - Express request object
   * @param {string} userId - User ID
   * @param {string} pin - New PIN
   * @returns {Promise<Object>}
   */
  setPin = async (req, userId, pin, oldPin) => {
    const user = req.user;
    if (!user || !user.organization) {
      throw new HttpError(401, 'UNAUTHORIZED', 'Authentication required');
    }

    // Get user
    const targetUser = await this.userRepository.findById(req, userId);
    if (!targetUser) {
      throw new HttpError(404, 'USER_NOT_FOUND', 'User not found');
    }

    // Verify user belongs to same organization (unless system user)
    if (!user.isSystem && targetUser.organizationId !== user.organization.id) {
      throw new HttpError(
        403,
        'FORBIDDEN',
        'Cannot set PIN for user in different organization'
      );
    }

    // If user already has a PIN set, oldPin is required
    if (targetUser.pinHash) {
      if (!oldPin) {
        throw new HttpError(
          400,
          'OLD_PIN_REQUIRED',
          'Old PIN is required to change existing PIN'
        );
      }

      // Decrypt oldPin if it's encrypted
      if (isEncrypted(oldPin)) {
        try {
          oldPin = decryptPin(oldPin); // Uses timeout from env config
          logger.debug('Old PIN decrypted successfully');
        } catch (error) {
          logger.error('Failed to decrypt old PIN', { error: error.message });
          if (error.message.includes('expired')) {
            throw new HttpError(
              400,
              'PIN_EXPIRED',
              'Old PIN has expired. Please try again.'
            );
          }
          throw new HttpError(
            400,
            'INVALID_ENCRYPTED_PIN',
            'Invalid encrypted old PIN format'
          );
        }
      }

      // Validate old PIN format
      if (!oldPin || typeof oldPin !== 'string' || !/^\d{4,6}$/.test(oldPin)) {
        throw new HttpError(
          400,
          'VALIDATION_ERROR',
          'Old PIN must be 4-6 digits'
        );
      }

      // Verify old PIN matches
      const isOldPinValid = await verifyPin(oldPin, targetUser.pinHash);
      if (!isOldPinValid) {
        throw new HttpError(401, 'OLD_PIN_INVALID', 'Old PIN does not match');
      }
    }

    // Decrypt new PIN if it's encrypted (frontend sends encrypted PIN)
    if (isEncrypted(pin)) {
      try {
        pin = decryptPin(pin); // Uses timeout from env config
        logger.debug('New PIN decrypted successfully for setPin');
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
    }

    // Validate new PIN format (after decryption)
    if (!pin || typeof pin !== 'string' || !/^\d{4,6}$/.test(pin)) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'PIN must be 4-6 digits');
    }

    // Check if new PIN is same as old PIN
    if (targetUser.pinHash) {
      const isSamePin = await verifyPin(pin, targetUser.pinHash);
      if (isSamePin) {
        throw new HttpError(
          400,
          'PIN_SAME_AS_OLD',
          'New PIN cannot be the same as the old PIN'
        );
      }
    }

    // Hash new PIN
    const pinHash = await hashPin(pin);

    // Update user
    await this.userRepository.update(req, userId, { pinHash });

    logger.info(
      `PIN ${
        targetUser.pinHash ? 'changed' : 'set'
      } for user: ${userId} by user: ${user.userId}`
    );

    return {
      message: targetUser.pinHash
        ? 'PIN changed successfully'
        : 'PIN set successfully',
    };
  };
}

