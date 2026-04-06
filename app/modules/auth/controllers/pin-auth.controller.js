import { getPublicKey } from '../utils/pin-encryption.util.js';
import { env } from '../../../config/env.js';

export class PinAuthController {
  constructor({ pinAuthCommandService }) {
    this.pinAuthCommandService = pinAuthCommandService;
  }

  verifyPin = async (req, res, next) => {
    try {
      const userId = req.body.userId || req.headers['x-user-id'];
      const pin = req.body.pin || req.headers['x-pin'];

      if (!userId) {
        return res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: 'userId is required in request body or x-user-id header',
        });
      }

      if (!pin) {
        return res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: 'PIN is required in request body or x-pin header',
        });
      }

      const response = await this.pinAuthCommandService.verifyPin(
        req,
        userId,
        pin,
      );
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  setPin = async (req, res, next) => {
    try {
      const userId = req.user.userId;
      const pin = req.body.pin;
      const oldPin = req.body.oldPin;

      if (!userId || !pin) {
        return res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: 'userId and pin are required',
        });
      }

      const response = await this.pinAuthCommandService.setPin(
        req,
        userId,
        pin,
        oldPin,
      );
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Test endpoint for PIN verification middleware
   * Returns logged-in user info and verified user info
   */
  testPinVerification = async (req, res, next) => {
    try {
      const loggedInUser = req.user; // From auth middleware
      const verifiedUser = req.verifiedUser; // From PIN verification middleware

      res.json({
        message: 'PIN verification test successful',
        data: {
          loggedInUser: {
            userId: loggedInUser?.userId,
            phone: loggedInUser?.phone,
            firstname: loggedInUser?.firstname,
            lastname: loggedInUser?.lastname,
            middlename: loggedInUser?.middlename,
            organization: loggedInUser?.organization
              ? {
                  id: loggedInUser.organization.id,
                  name: loggedInUser.organization.name,
                }
              : null,
            isSystem: loggedInUser?.isSystem,
            roles: loggedInUser?.roles || [],
          },
          verifiedUser: verifiedUser
            ? {
                userId: verifiedUser.userId,
                phone: verifiedUser.phone,
                firstname: verifiedUser.firstname,
                lastname: verifiedUser.lastname,
                middlename: verifiedUser.middlename,
                organizationId: verifiedUser.organizationId,
              }
            : null,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get public key for PIN encryption (frontend uses this to encrypt PINs)
   */
  getPublicKey = async (req, res, next) => {
    try {
      const publicKey = getPublicKey();

      res.json({
        publicKey: publicKey.trim(),
        algorithm: 'RSA-OAEP',
        keySize: 2048,
        timeoutMinutes: env.pinEncryption?.timeoutMinutes || 5,
        rateLimit: {
          maxAttempts: env.pinRateLimit?.maxAttempts || 5,
          windowMinutes: env.pinRateLimit?.windowMinutes || 15,
        },
        encryptionFormat: {
          description:
            'Encrypt JSON payload: { pin: "1234", timestamp: Date.now() }',
          example: {
            pin: '1234',
            timestamp: Date.now(),
          },
        },
      });
    } catch (error) {
      next(error);
    }
  };
}
