import { Op } from 'sequelize';
import { HttpError } from '../../../../shared/utils/http-error.js';
import { logger } from '../../../../shared/logger/logger.js';
import { env } from '../../../../config/env.js';
import { models } from '../../../../shared/db/data-source.js';
import {
  generateBackupCodes,
  hashBackupCodes,
  verifyBackupCode,
} from '../../utils/otp.util.js';
import { sendSmsOtp } from '../../utils/sms.util.js';
import { createCentralAuthService } from '../auths/central-auth.service.js';
import {
  generateTotpSecret,
  generateTotpQrCode,
  verifyTotpToken,
} from '../../utils/totp.util.js';

export class MfaCommandService {
  constructor({ mfaRepository, otpCodeRepository, userRepository }) {
    this.mfaRepository = mfaRepository;
    this.otpCodeRepository = otpCodeRepository;
    this.userRepository = userRepository;
  }

  /**
   * Get MFA settings for the current user
   * @param {Object} req - Express request object
   * @returns {Promise<Object>} MFA settings (without sensitive data)
   */
  getMfaSettings = async (req) => {
    const userId = req.user.userId;
    const mfaSettings = await this.mfaRepository.getMfaSettings(req, userId);

    if (!mfaSettings) {
      return {
        smsOtpEnabled: false,
        totpEnabled: false,
        mfaEnabledOrganizationIds: [],
        mfaEnabledOrganizations: [],
        isTotpVerified: false,
      };
    }

    const orgIds = mfaSettings.mfaEnabledOrganizationIds;
    const mfaEnabledOrganizationIds = Array.isArray(orgIds) ? [...orgIds] : [];
    // TOTP is verified/configured when user completed setup (enabled and has secret)
    const isTotpVerified = !!(
      mfaSettings.totpSecret
    );

    // Fetch organization names for MFA-enabled orgs (id + name)
    let mfaEnabledOrganizations = [];
    if (mfaEnabledOrganizationIds.length > 0) {
      const idList = mfaEnabledOrganizationIds.map((id) => String(id));
      const orgs = await models.Organization.findAll({
        where: { id: { [Op.in]: idList } },
        attributes: ['id', 'name'],
      });
      const byId = new Map(orgs.map((o) => [String(o.id), { id: o.id, name: o.name }]));
      mfaEnabledOrganizations = idList.map((id) => byId.get(id) || { id, name: null });
    }

    return {
      smsOtpEnabled: mfaSettings.smsOtpEnabled,
      totpEnabled: mfaSettings.totpEnabled,
      mfaEnabledOrganizationIds,
      mfaEnabledOrganizations,
      isTotpVerified,
    };
  };

  /**
   * Enable SMS OTP for a user (adds current org to mfaEnabledOrganizationIds)
   * @param {Object} req - Express request object
   * @returns {Promise<Object>} Success message
   */
  enableSmsOtp = async (req) => {
    const userId = req.user.userId;
    const organizationId = req.user.organization?.id || req.user.organizationId;

    // Verify user exists and is active
    const user = await this.userRepository.findById(req, userId);
    if (!user || !user.isActive) {
      throw new HttpError(404, 'USER_NOT_FOUND', 'User not found or inactive');
    }

    if (!user.phone) {
      throw new HttpError(
        400,
        'PHONE_REQUIRED',
        'User must have a phone number to enable SMS OTP'
      );
    }

    await this.mfaRepository.upsertMfaSettingsWithOrg(req, userId, {
      smsOtpEnabled: true,
    }, organizationId);

    logger.info(`SMS OTP enabled for user: ${userId}, org: ${organizationId}`);

    return {
      message: 'SMS OTP enabled successfully',
      smsOtpEnabled: true,
    };
  };

  /**
   * Disable SMS OTP for a user
   * @param {Object} req - Express request object
   * @returns {Promise<Object>} Success message
   */
  disableSmsOtp = async (req) => {
    const userId = req.user.userId;

    await this.mfaRepository.upsertMfaSettings(req, userId, {
      smsOtpEnabled: false,
    });

    logger.info(`SMS OTP disabled for user: ${userId}`);

    return {
      message: 'SMS OTP disabled successfully',
      smsOtpEnabled: false,
    };
  };

  /**
   * Initiate TOTP setup - generate secret and QR code
   * Allows re-setup even if TOTP is already enabled
   * @param {Object} req - Express request object
   * @returns {Promise<Object>} TOTP setup data (secret, QR code)
   */
  initiateTotpSetup = async (req) => {
    const userId = req.user.userId;

    // Verify user exists and is active
    const user = await this.userRepository.findById(req, userId);
    if (!user || !user.isActive) {
      throw new HttpError(404, 'USER_NOT_FOUND', 'User not found or inactive');
    }

    // Check if TOTP is already enabled (for re-setup scenario)
    const existingSettings = await this.mfaRepository.getMfaSettings(
      req,
      userId
    );
    const isReSetup = existingSettings && existingSettings.totpEnabled;

    // Generate new TOTP secret
    const { secret, otpauthUrl } = generateTotpSecret(
      userId,
      user.phone || user.id
    );

    // Generate QR code
    const qrCodeDataUrl = await generateTotpQrCode(otpauthUrl);

    // Store new secret temporarily (user needs to verify before enabling)
    // If re-setting up, disable old TOTP and clear backup codes
    await this.mfaRepository.upsertMfaSettings(req, userId, {
      totpSecret: secret,
      totpEnabled: false, // Not enabled until verified
      totpBackupCodes: null, // Clear old backup codes
    });

    logger.info(
      `TOTP setup ${
        isReSetup ? 're-initiated' : 'initiated'
      } for user: ${userId}`
    );

    return {
      message: isReSetup
        ? 'TOTP re-setup initiated. Verify the code to enable with new secret.'
        : 'TOTP setup initiated. Verify the code to enable.',
      secret: secret, // Return secret for manual entry if QR code fails
      qrCode: qrCodeDataUrl,
      otpauthUrl: otpauthUrl, // For manual entry
      isReSetup: isReSetup, // Indicate if this is a re-setup
    };
  };

  /**
   * Verify and enable TOTP
   * Works for both initial setup and re-setup
   * @param {Object} req - Express request object
   * @param {string} token - TOTP token from user's authenticator app
   * @returns {Promise<Object>} Success message with backup codes
   */
  verifyAndEnableTotp = async (req, token) => {
    const userId = req.user.userId;

    // Get MFA settings
    const mfaSettings = await this.mfaRepository.getMfaSettings(req, userId);
    if (!mfaSettings || !mfaSettings.totpSecret) {
      throw new HttpError(
        400,
        'TOTP_NOT_INITIATED',
        'TOTP setup not initiated. Please initiate setup first.'
      );
    }

    // Allow verification even if TOTP is currently enabled (for re-setup scenario)
    // The secret would have been updated during initiateTotpSetup
    const isReSetup = mfaSettings.totpEnabled === true;

    // Verify token against the new secret
    const isValid = verifyTotpToken(token, mfaSettings.totpSecret);
    if (!isValid) {
      throw new HttpError(401, 'INVALID_TOTP_TOKEN', 'Invalid TOTP token');
    }

    // Generate new backup codes
    const backupCodes = generateBackupCodes();
    const hashedBackupCodes = await hashBackupCodes(backupCodes);

    const organizationId = req.user.organization?.id || req.user.organizationId;
    await this.mfaRepository.upsertMfaSettingsWithOrg(
      req,
      userId,
      {
        totpEnabled: true,
        totpBackupCodes: JSON.stringify(hashedBackupCodes),
      },
      organizationId
    );

    logger.info(
      `TOTP ${isReSetup ? 're-enabled' : 'enabled'} for user: ${userId}, org: ${organizationId}`
    );

    return {
      message: isReSetup
        ? 'TOTP re-enabled successfully with new secret'
        : 'TOTP enabled successfully',
      totpEnabled: true,
      backupCodes: backupCodes, // Return plain codes only once - user must save them
      isReSetup: isReSetup,
    };
  };

  /**
   * Disable TOTP for a user
   * @param {Object} req - Express request object
   * @returns {Promise<Object>} Success message
   */
  disableTotp = async (req) => {
    const userId = req.user.userId;

    await this.mfaRepository.upsertMfaSettings(req, userId, {
      totpEnabled: false,
      totpSecret: null,
      totpBackupCodes: null,
    });

    logger.info(`TOTP disabled for user: ${userId}`);

    return {
      message: 'TOTP disabled successfully',
      totpEnabled: false,
    };
  };

  /**
   * Toggle TOTP enabled state (simple enable/disable without full setup)
   * @param {Object} req - Express request object
   * @param {boolean} enabled - Whether to enable or disable TOTP
   * @returns {Promise<Object>} Success message
   */
  toggleTotpEnabled = async (req, enabled) => {
    const userId = req.user.userId;

    // Get current MFA settings
    const mfaSettings = await this.mfaRepository.getMfaSettings(req, userId);

    if (enabled === true) {
      // Enabling: require TOTP secret to exist
      if (!mfaSettings || !mfaSettings.totpSecret) {
        throw new HttpError(
          400,
          'TOTP_NOT_SETUP',
          'TOTP must be set up first before it can be enabled. Please initiate TOTP setup.'
        );
      }
    }

    // Update only the enabled state
    await this.mfaRepository.updateTotpEnabled(req, userId, enabled);

    logger.info(`TOTP ${enabled ? 'enabled' : 'disabled'} for user: ${userId}`);

    return {
      message: `TOTP ${enabled ? 'enabled' : 'disabled'} successfully`,
      totpEnabled: enabled,
    };
  };

  /**
   * Send SMS OTP to user
   * @param {Object} req - Express request object
   * @param {string} userId - User ID
   * @param {string} purpose - Purpose of OTP (default: 'login')
   * @returns {Promise<Object>} Success message (OTP not returned for security)
   */
  sendSmsOtp = async (req, userId, purpose = 'login') => {
    // Get user
    const user = await this.userRepository.findById(req, userId);
    if (!user || !user.isActive) {
      throw new HttpError(404, 'USER_NOT_FOUND', 'User not found or inactive');
    }

    if (!user.phone) {
      throw new HttpError(
        400,
        'PHONE_REQUIRED',
        'User must have a phone number to receive SMS OTP'
      );
    }

    // Check if SMS OTP is enabled
    const mfaSettings = await this.mfaRepository.getMfaSettings(req, userId);
    if (!mfaSettings || !mfaSettings.smsOtpEnabled) {
      throw new HttpError(
        400,
        'SMS_OTP_NOT_ENABLED',
        'SMS OTP is not enabled for this user'
      );
    }

    // Send SMS via central auth API (it handles OTP generation)
    await sendSmsOtp(user.phone);

    logger.info(`SMS OTP sent to user: ${userId} for purpose: ${purpose}`);

    return {
      message: 'SMS OTP sent successfully',
      expiresInMinutes: env.mfa.otpExpirationMinutes,
    };
  };

  /**
   * Verify SMS OTP
   * @param {Object} req - Express request object
   * @param {string} userId - User ID
   * @param {string} otp - OTP code from user
   * @param {string} purpose - Purpose of OTP (default: 'login')
   * @returns {Promise<Object>} Success message
   */
  verifySmsOtp = async (req, userId, otp, purpose = 'login') => {
    // Get user to get phone number
    const user = await this.userRepository.findById(req, userId);
    if (!user || !user.isActive) {
      throw new HttpError(404, 'USER_NOT_FOUND', 'User not found or inactive');
    }

    if (!user.phone) {
      throw new HttpError(
        400,
        'PHONE_REQUIRED',
        'User must have a phone number to verify SMS OTP'
      );
    }

    // Verify OTP via central auth API
    const centralAuth = createCentralAuthService();
    try {
      await centralAuth.verifyOtp(user.phone, otp);
    } catch (error) {
      logger.warn(`SMS OTP verification failed for user: ${userId}`, {
        error: error.message,
        phone: user.phone,
      });
      throw new HttpError(401, 'INVALID_OTP', error.message || 'Invalid or expired OTP code');
    }

    logger.info(`SMS OTP verified for user: ${userId} for purpose: ${purpose}`);

    return {
      message: 'OTP verified successfully',
      verified: true,
    };
  };

  /**
   * Verify TOTP token
   * @param {Object} req - Express request object
   * @param {string} userId - User ID
   * @param {string} token - TOTP token or backup code
   * @returns {Promise<Object>} Success message
   */
  verifyTotp = async (req, userId, token) => {
    // Get MFA settings
    const user = await this.userRepository.findById(req, userId);
    if (!user || !user.isActive) {
      throw new HttpError(404, 'USER_NOT_FOUND', 'User not found or inactive');
    }
    const phone = user.phone;
    const mfaSettings = await this.mfaRepository.getMfaSettingsByPhone(
      req,
      phone,
    );
    if (!mfaSettings || !mfaSettings.totpEnabled) {
      throw new HttpError(
        400,
        'TOTP_NOT_ENABLED',
        'TOTP is not enabled for this user',
      );
    }
    userId = mfaSettings.userId;
    // Try TOTP token first
    const isValidTotp = verifyTotpToken(token, mfaSettings.totpSecret);
    if (isValidTotp) {
      logger.info(`TOTP verified for user: ${userId}`);
      return {
        message: 'TOTP verified successfully',
        verified: true,
        method: 'totp',
      };
    }

    // Try backup code
    if (mfaSettings.totpBackupCodes) {
      const backupCodes = JSON.parse(mfaSettings.totpBackupCodes);
      const { valid, index } = await verifyBackupCode(token, backupCodes);

      if (valid) {
        // Remove used backup code
        backupCodes.splice(index, 1);
        await this.mfaRepository.upsertMfaSettings(req, userId, {
          totpBackupCodes: JSON.stringify(backupCodes),
        });

        logger.info(`TOTP backup code verified for user: ${userId}`);
        return {
          message: 'Backup code verified successfully',
          verified: true,
          method: 'backup_code',
          remainingBackupCodes: backupCodes.length,
        };
      }
    }

    throw new HttpError(
      401,
      'INVALID_TOTP',
      'Invalid TOTP token or backup code'
    );
  };

  /**
   * MFA is required when organizationId is in mfaEnabledOrganizationIds.
   * When organizationId is null, find by phone only and require MFA if any method is enabled.
   * @param {Object} req - Express request object (organizationId or user.organization.id optional)
   * @param {string} userId - User ID
   * @returns {Promise<Object>} MFA status and enabled methods
   */
  checkMfaStatus = async (req, userId) => {
    const organizationId =
      req.organizationId ||
      req.user?.organization?.id ||
      req.user?.organizationId;
    const mfaSettings = await this.mfaRepository.getMfaSettings(req, userId);
    const enabledMethods = await this.mfaRepository.getEnabledMfaMethods(
      req,
      userId
    );

    const hasAnyMethod = enabledMethods.length > 0;
    const orgIds = mfaSettings?.mfaEnabledOrganizationIds;
    const idsArray = Array.isArray(orgIds) ? orgIds : [];
    const orgIdStr = organizationId != null ? String(organizationId) : null;

    let mfaEnabled;
    if (orgIdStr === null) {
      // OrganizationId is null: find by phone only – require MFA if any method enabled
      mfaEnabled = hasAnyMethod;
    } else {
      const isOrgInList = idsArray.some((id) => String(id) === orgIdStr);
      const legacyNoList = hasAnyMethod && idsArray.length === 0;
      mfaEnabled = hasAnyMethod && (isOrgInList || legacyNoList);
    }

    return {
      mfaEnabled,
      enabledMethods: mfaEnabled ? enabledMethods : [],
      smsOtpEnabled: mfaSettings?.smsOtpEnabled || false,
      totpEnabled: mfaSettings?.totpEnabled || false,
      mfaEnabledOrganizationIds: idsArray,
    };
  };

  /**
   * Add current organization to MFA-required list.
   * @param {Object} req - Express request object
   * @returns {Promise<Object>}
   */
  addOrganizationToMfa = async (req) => {
    const userId = req.user.userId;
    const organizationId = req.user.organization?.id || req.user.organizationId;
    if (!organizationId) {
      throw new HttpError(
        400,
        'ORGANIZATION_REQUIRED',
        'Organization context is required to add MFA for this org'
      );
    }

    const updated = await this.mfaRepository.addOrganizationToMfa(
      req,
      userId,
      organizationId
    );

    return {
      message: 'Organization added to MFA. Login with this org will require MFA.',
      mfaEnabledOrganizationIds: updated.mfaEnabledOrganizationIds || [],
    };
  };

  /**
   * Remove an organization from the MFA-required list.
   * @param {Object} req - Express request object
   * @param {string} organizationId - Organization ID to remove (optional)
   * @returns {Promise<Object>}
   */
  removeOrganizationFromMfa = async (req, organizationId = null) => {
    const userId = req.user.userId;
    const orgId =
      organizationId ||
      req.user.organization?.id ||
      req.user.organizationId;
    if (!orgId) {
      throw new HttpError(
        400,
        'ORGANIZATION_REQUIRED',
        'Organization ID is required to remove from MFA'
      );
    }

    const updated = await this.mfaRepository.removeOrganizationFromMfa(
      req,
      userId,
      orgId
    );

    return {
      message: 'Organization removed from MFA.',
      mfaEnabledOrganizationIds: updated?.mfaEnabledOrganizationIds || [],
    };
  };
}
