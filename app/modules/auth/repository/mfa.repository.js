import { BaseRepository } from '../../../shared/repository/base.repository.js';
import { models } from '../../../shared/db/data-source.js';
import { Op } from 'sequelize';
import { logger } from '../../../shared/logger/logger.js';
import { applyScopeFilters } from '../../../shared/repository/scope-filtering.js';

export class MfaRepository extends BaseRepository {
  constructor() {
    super({ Model: models.UserMfaSettings });
  }

  /**
   * Get MFA settings by phone number (shared across users with same phone)
   * Note: MFA settings are phone-based and shared across organizations, so we bypass scope filters
   * @param {Object} req - Express request object
   * @param {string} phone - Phone number
   * @returns {Promise<Object|null>} MFA settings or null
   */
  async getMfaSettingsByPhone(req, phone) {
    try {
      // MFA settings are phone-based and shared across organizations
      // Don't apply scope filters - phone is the unique identifier
      const mfaSettings = await this.Model.findOne({
        where: { phone },
        include: [
          {
            model: models.User,
            as: 'user',
            attributes: ['id', 'phone', 'isActive'],
            required: false,
          },
        ],
      });

      return mfaSettings;
    } catch (error) {
      logger.error('Error fetching MFA settings by phone', {
        error: error.message,
        phone,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Get MFA settings for a user (by userId - gets phone from user first)
   * @param {Object} req - Express request object
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} MFA settings or null
   */
  async getMfaSettings(req, userId) {
    try {
      // Get user to get phone number
      const user = await models.User.findByPk(userId, {
        attributes: ['id', 'phone'],
      });

      if (!user || !user.phone) {
        return null;
      }

      // Get MFA settings by phone (shared across users with same phone)
      return await this.getMfaSettingsByPhone(req, user.phone);
    } catch (error) {
      logger.error('Error fetching MFA settings', {
        error: error.message,
        userId,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Create or update MFA settings by phone (shared across users with same phone)
   * Note: MFA settings are phone-based and shared across organizations, so we bypass scope filters
   * @param {Object} req - Express request object
   * @param {string} phone - Phone number
   * @param {string} userId - User ID (for reference, optional)
   * @param {Object} data - MFA settings data
   * @returns {Promise<Object>} Created/updated MFA settings
   */
  async upsertMfaSettingsByPhone(req, phone, userId = null, data = {}) {
    try {
      // MFA settings are phone-based and shared across organizations
      // Don't apply scope filters - phone is the unique identifier
      const [mfaSettings, created] = await this.Model.findOrCreate({
        where: { phone },
        defaults: {
          phone,
          userId: userId || null, // Store userId for reference
          ...data,
        },
      });

      if (!created) {
        // Update existing settings (shared across all users with this phone)
        const updateData = { ...data };
        // Only update userId if provided and different
        if (userId && mfaSettings.userId !== userId) {
          updateData.userId = userId; // Update to latest user
        }
        await mfaSettings.update(updateData);
        await mfaSettings.reload();
      }

      return mfaSettings;
    } catch (error) {
      logger.error('Error upserting MFA settings by phone', {
        error: error.message,
        phone,
        userId,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Create or update MFA settings for a user (by userId - gets phone from user first)
   * @param {Object} req - Express request object
   * @param {string} userId - User ID
   * @param {Object} data - MFA settings data
   * @returns {Promise<Object>} Created/updated MFA settings
   */
  async upsertMfaSettings(req, userId, data) {
    try {
      // Get user to get phone number
      const user = await models.User.findByPk(userId, {
        attributes: ['id', 'phone'],
      });

      if (!user || !user.phone) {
        throw new Error('User not found or phone number not set');
      }

      // Upsert by phone (shared across users with same phone)
      return await this.upsertMfaSettingsByPhone(req, user.phone, userId, data);
    } catch (error) {
      logger.error('Error upserting MFA settings', {
        error: error.message,
        userId,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Upsert MFA settings and ensure organizationId is in mfaEnabledOrganizationIds (if provided).
   * @param {Object} req - Express request object
   * @param {string} userId - User ID
   * @param {Object} data - MFA settings data
   * @param {string} [organizationId] - Organization ID to add to the list
   * @returns {Promise<Object>} Created/updated MFA settings
   */
  async upsertMfaSettingsWithOrg(req, userId, data, organizationId = null) {
    const user = await models.User.findByPk(userId, {
      attributes: ['id', 'phone'],
    });
    if (!user || !user.phone) {
      throw new Error('User not found or phone number not set');
    }

    const existing = await this.getMfaSettings(req, userId);
    let orgIds = Array.isArray(existing?.mfaEnabledOrganizationIds)
      ? [...existing.mfaEnabledOrganizationIds]
      : [];
    if (organizationId) {
      const idStr = String(organizationId);
      if (!orgIds.some((id) => String(id) === idStr)) {
        orgIds.push(idStr);
      }
    }
    const updateData = { ...data, mfaEnabledOrganizationIds: orgIds };
    return await this.upsertMfaSettingsByPhone(
      req,
      user.phone,
      userId,
      updateData
    );
  }

  /**
   * Add an organization ID to the MFA-required list for this user/phone.
   * @param {Object} req - Express request object
   * @param {string} userId - User ID
   * @param {string} organizationId - Organization ID to add
   * @returns {Promise<Object>} Updated MFA settings
   */
  async addOrganizationToMfa(req, userId, organizationId) {
    const user = await models.User.findByPk(userId, {
      attributes: ['id', 'phone'],
    });
    if (!user || !user.phone) {
      throw new Error('User not found or phone number not set');
    }

    const existing = await this.getMfaSettings(req, userId);
    if (!existing) {
      throw new Error(
        'MFA settings not found. Enable SMS OTP or TOTP first, then add organizations.'
      );
    }

    let orgIds = Array.isArray(existing.mfaEnabledOrganizationIds)
      ? [...existing.mfaEnabledOrganizationIds]
      : [];
    const idStr = String(organizationId);
    if (orgIds.some((id) => String(id) === idStr)) {
      return existing;
    }
    orgIds.push(idStr);

    return await this.upsertMfaSettingsByPhone(req, user.phone, userId, {
      mfaEnabledOrganizationIds: orgIds,
    });
  }

  /**
   * Remove an organization ID from the MFA-required list.
   * @param {Object} req - Express request object
   * @param {string} userId - User ID
   * @param {string} organizationId - Organization ID to remove
   * @returns {Promise<Object>} Updated MFA settings
   */
  async removeOrganizationFromMfa(req, userId, organizationId) {
    const user = await models.User.findByPk(userId, {
      attributes: ['id', 'phone'],
    });
    if (!user || !user.phone) {
      throw new Error('User not found or phone number not set');
    }

    const existing = await this.getMfaSettings(req, userId);
    if (!existing) {
      return existing;
    }

    const idStr = String(organizationId);
    let orgIds = Array.isArray(existing.mfaEnabledOrganizationIds)
      ? existing.mfaEnabledOrganizationIds.filter((id) => String(id) !== idStr)
      : [];

    return await this.upsertMfaSettingsByPhone(req, user.phone, userId, {
      mfaEnabledOrganizationIds: orgIds,
    });
  }

  /**
   * Check if user has any MFA enabled
   * @param {Object} req - Express request object
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} True if any MFA is enabled
   */
  async hasMfaEnabled(req, userId) {
    try {
      const mfaSettings = await this.getMfaSettings(req, userId);
      if (!mfaSettings) {
        return false;
      }
      return mfaSettings.smsOtpEnabled || mfaSettings.totpEnabled;
    } catch (error) {
      logger.error('Error checking MFA status', {
        error: error.message,
        userId,
        stack: error.stack,
      });
      return false;
    }
  }

  /**
   * Get enabled MFA methods for a user
   * @param {Object} req - Express request object
   * @param {string} userId - User ID
   * @returns {Promise<string[]>} Array of enabled MFA methods ('sms', 'totp')
   */
  async getEnabledMfaMethods(req, userId) {
    try {
      const mfaSettings = await this.getMfaSettings(req, userId);
      if (!mfaSettings) {
        return [];
      }

      const methods = [];
      if (mfaSettings.smsOtpEnabled) {
        methods.push('sms');
      }
      if (mfaSettings.totpEnabled) {
        methods.push('totp');
      }

      return methods;
    } catch (error) {
      logger.error('Error getting enabled MFA methods', {
        error: error.message,
        userId,
        stack: error.stack,
      });
      return [];
    }
  }

  /**
   * Update only the TOTP enabled state
   * Note: MFA settings are phone-based and shared across organizations, so we bypass scope filters
   * @param {Object} req - Express request object
   * @param {string} phone - Phone number
   * @param {boolean} enabled - Whether TOTP should be enabled
   * @returns {Promise<Object>} Updated MFA settings
   */
  async updateTotpEnabledByPhone(req, phone, enabled) {
    try {
      // MFA settings are phone-based and shared across organizations
      // Don't apply scope filters - phone is the unique identifier
      const mfaSettings = await this.Model.findOne({
        where: { phone },
      });

      if (!mfaSettings) {
        throw new Error('MFA settings not found for this phone number');
      }

      // Update only the enabled state
      await mfaSettings.update({ totpEnabled: enabled });
      await mfaSettings.reload();

      return mfaSettings;
    } catch (error) {
      logger.error('Error updating TOTP enabled state', {
        error: error.message,
        phone,
        enabled,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Update only the TOTP enabled state (by userId - gets phone from user first)
   * @param {Object} req - Express request object
   * @param {string} userId - User ID
   * @param {boolean} enabled - Whether TOTP should be enabled
   * @returns {Promise<Object>} Updated MFA settings
   */
  async updateTotpEnabled(req, userId, enabled) {
    try {
      // Get user to get phone number
      const user = await models.User.findByPk(userId, {
        attributes: ['id', 'phone'],
      });

      if (!user || !user.phone) {
        throw new Error('User not found or phone number not set');
      }

      // Update by phone (shared across users with same phone)
      return await this.updateTotpEnabledByPhone(req, user.phone, enabled);
    } catch (error) {
      logger.error('Error updating TOTP enabled state', {
        error: error.message,
        userId,
        enabled,
        stack: error.stack,
      });
      throw error;
    }
  }
}

// OTP Code Repository
export class OtpCodeRepository extends BaseRepository {
  constructor() {
    super({ Model: models.OtpCode });
  }

  /**
   * Create a new OTP code
   * @param {Object} req - Express request object
   * @param {Object} data - OTP code data
   * @returns {Promise<Object>} Created OTP code
   */
  async createOtp(req, data) {
    try {
      const scopedOptions = await applyScopeFilters(
        req,
        {
          where: {},
        },
        this.Model
      );
      const otp = await this.Model.create({
        ...data,
        ...scopedOptions.where,
      });
      return otp;
    } catch (error) {
      logger.error('Error creating OTP', {
        error: error.message,
        data,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Find a valid OTP code for a user
   * @param {Object} req - Express request object
   * @param {string} userId - User ID
   * @param {string} code - OTP code (plain text, will be verified against hash)
   * @param {string} purpose - Purpose of OTP (default: 'login')
   * @returns {Promise<Object|null>} OTP code record or null
   */
  async findValidOtp(req, userId, code, purpose = 'login') {
    try {
      const scopedOptions = await applyScopeFilters(
        req,
        {
          where: {
            userId,
            purpose,
            used: false,
            expiresAt: {
              [Op.gt]: new Date(),
            },
          },
        },
        this.Model
      );
      const otps = await this.Model.findAll({
        where: scopedOptions.where,
        order: [['createdAt', 'DESC']],
        limit: 10, // Check last 10 OTPs
      });

      // Verify code against each OTP hash
      const { verifyOtp } = await import('../utils/otp.util.js');
      for (const otp of otps) {
        const isValid = await verifyOtp(code, otp.code);
        if (isValid) {
          return otp;
        }
      }

      return null;
    } catch (error) {
      logger.error('Error finding valid OTP', {
        error: error.message,
        userId,
        purpose,
        stack: error.stack,
      });
      return null;
    }
  }

  /**
   * Mark an OTP as used
   * @param {Object} req - Express request object
   * @param {string} otpId - OTP ID
   * @returns {Promise<Object>} Updated OTP
   */
  async markOtpAsUsed(req, otpId) {
    try {
      const otp = await this.Model.findByPk(otpId);
      if (!otp) {
        throw new Error('OTP not found');
      }

      await otp.update({
        used: true,
        usedAt: new Date(),
      });

      return otp;
    } catch (error) {
      logger.error('Error marking OTP as used', {
        error: error.message,
        otpId,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Clean up expired OTPs (optional: can be run as a cron job)
   * @param {Object} req - Express request object
   * @param {number} daysOld - Delete OTPs older than this many days
   * @returns {Promise<number>} Number of deleted OTPs
   */
  async cleanupExpiredOtps(req, daysOld = 7) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const scopedOptions = await applyScopeFilters(
        req,
        {
          where: {
            expiresAt: {
              [Op.lt]: cutoffDate,
            },
          },
        },
        this.Model
      );
      const deletedCount = await this.Model.destroy({
        where: scopedOptions.where,
        force: true, // Hard delete
      });

      return deletedCount;
    } catch (error) {
      logger.error('Error cleaning up expired OTPs', {
        error: error.message,
        daysOld,
        stack: error.stack,
      });
      return 0;
    }
  }
}
