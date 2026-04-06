import { HttpError } from "../../../../shared/utils/http-error.js";
import { generateToken, generateRefreshToken, validateRefreshToken } from '../../middleware/jwt.js';
import { models } from '../../../../shared/db/data-source.js';
import { createCentralAuthService } from './central-auth.service.js';
import { PhoneUtil } from '../../../../shared/utils/phone.util.js';
import { logger } from '../../../../shared/logger/logger.js';
import { env } from '../../../../config/env.js';
import { Op } from 'sequelize';
import { testConnection } from '../../../../shared/db/database.js';
import { validatePasswordStrength } from '../../../../shared/utils/password-validator.js';

const AUTH_MAX_INVALID_LOGIN_ATTEMPTS = Math.max(
  Number(env.auth?.maxInvalidLoginAttempts ?? 5),
  1,
);
const AUTH_TEMPORARY_BAN_MINUTES = Math.max(
  Number(env.auth?.temporaryBanMinutes ?? 15),
  1,
);
const DEFAULT_SYSTEM_USER_PHONE = '+251921636677';

let TRUSTED_SYSTEM_USER_PHONE = null;
try {
  TRUSTED_SYSTEM_USER_PHONE = PhoneUtil.checkValidPhone(
    process.env.SYSTEM_USER_PHONE ?? DEFAULT_SYSTEM_USER_PHONE,
    'ET',
  );
} catch {
  TRUSTED_SYSTEM_USER_PHONE = DEFAULT_SYSTEM_USER_PHONE;
}

async function getLoginBanState(phone) {
  const row = await models.LoginBan.findByPk(phone);
  return row ? row.get({ plain: true }) : null;
}

async function upsertLoginBanState(phone, state) {
  await models.LoginBan.upsert({
    phone,
    failedAttempts: state.failedAttempts ?? 0,
    lockedUntil: state.lockedUntil ?? null,
    permanentBanned: state.permanentBanned ?? false,
    banReason: state.banReason ?? null,
  });
}

async function deleteLoginBanState(phone) {
  await models.LoginBan.destroy({ where: { phone } });
}

function isStillLocked(lockedUntil) {
  if (!lockedUntil) return false;
  return new Date(lockedUntil).getTime() > Date.now();
}

export class AuthService {
  constructor({ userRepository, mfaService = null }) {
    this.userRepository = userRepository;
    this.centralAuth = createCentralAuthService();
    this.mfaService = mfaService; // Optional - injected if MFA is enabled
  }

  /**
   * Login - Authenticate with central auth and generate JWT token
   * @param {Object} loginData - Login data (phone, password, organizationId, isDefault)
   * @returns {Object} Token and user information
   */
  login = async (loginData) => {
    const { phone, password, organizationId, isDefault } = loginData;

    // Format and validate phone number using PhoneUtil
    let formattedPhone;
    try {
      formattedPhone = PhoneUtil.checkValidPhone(phone, 'ET');
    } catch (error) {
      throw new HttpError(
        400,
        'INVALID_PHONE',
        error.message || 'Invalid phone number format',
      );
    }

    const lockState = await getLoginBanState(formattedPhone);
    if (lockState?.permanentBanned) {
      throw new HttpError(
        403,
        'CLIENT_BANNED_PERMANENTLY',
        lockState.banReason ||
          'Client has been permanently banned. Please contact the administrator.',
      );
    }
    if (lockState?.lockedUntil && isStillLocked(lockState.lockedUntil)) {
      const minutesLeft = Math.ceil(
        (new Date(lockState.lockedUntil).getTime() - Date.now()) / (60 * 1000),
      );
      throw new HttpError(
        429,
        'LOGIN_TEMPORARILY_BLOCKED',
        `Too many invalid login attempts. Try again in ${minutesLeft} minute(s).`,
      );
    }

    // Authenticate with central auth: use password signin if password >= 8 chars, else PIN signin
    let tokenClaims;
    try {
      const usePasswordSignin =
        typeof password === 'string' && password.length >= 8;
      tokenClaims = usePasswordSignin
        ? await this.centralAuth.signInWithPassword(formattedPhone, password)
        : await this.centralAuth.signIn(formattedPhone, password);
    } catch (error) {
      // Log the actual error for debugging
      logger.warn('Central auth sign in failed', {
        phone: formattedPhone,
        error: error.message,
        stack: error.stack,
      });

      const nextAttempts = Number(lockState?.failedAttempts ?? 0) + 1;
      const shouldLock = nextAttempts >= AUTH_MAX_INVALID_LOGIN_ATTEMPTS;
      const lockedUntil = shouldLock
        ? new Date(Date.now() + AUTH_TEMPORARY_BAN_MINUTES * 60 * 1000)
        : null;

      await upsertLoginBanState(formattedPhone, {
        failedAttempts: shouldLock ? 0 : nextAttempts,
        lockedUntil,
        permanentBanned: false,
      });

      if (shouldLock) {
        throw new HttpError(
          429,
          'LOGIN_TEMPORARILY_BLOCKED',
          `Too many invalid login attempts. Try again in ${AUTH_TEMPORARY_BAN_MINUTES} minute(s).`,
        );
      }

      // Preserve original error message if it's informative
      const errorMessage =
        error.message && error.message.includes('Authentication failed')
          ? error.message.replace('Failed to sign in: ', '')
          : 'Invalid phone or password';

      const inActiveUser = await models.User.findOne({
        where: { phone: formattedPhone, isActive: false },
      });
      if (inActiveUser) {
        throw new HttpError(
          401,
          'USER_INACTIVE',
          'Please reset your password to activate your account',
        );
      }
      throw new HttpError(401, 'AUTH_FAILED', errorMessage);
    }

    // Parse account ID from token
    const accountId = tokenClaims.userId;

    // Get all users for this account (across all organizations)
    // Create a mock req object for repository methods
    const req = {};
    const allUsers = await this.userRepository.findByAccountIdOrPhone(
      req,
      accountId,
      formattedPhone,
    );

    // Update account ID for users that don't have it set
    for (const user of allUsers) {
      if (!user.accountId) {
        user.accountId = accountId;
        await user.save();
      }
    }

    let selectedUser = null;

    // Handle organization selection logic
    if (organizationId) {
      // User specified an organization ID
      const orgId = organizationId;

      // Find user in the specified organization
      // Handle both string and UUID comparison
      const orgIdStr = typeof orgId === 'string' ? orgId : orgId.toString();
      selectedUser = allUsers.find((u) => {
        if (!u.organizationId) return false;
        const userOrgIdStr =
          typeof u.organizationId === 'string'
            ? u.organizationId
            : u.organizationId.toString();
        return userOrgIdStr === orgIdStr;
      });

      if (!selectedUser) {
        throw new HttpError(
          404,
          'USER_NOT_IN_ORG',
          'User does not belong to the specified organization',
        );
      }

      // If isDefault=true, set this organization as default and others as false
      if (isDefault === true) {
        // Set all users to isDefault=false first
        for (const user of allUsers) {
          if (user.isDefault) {
            user.isDefault = false;
            await user.save();
          }
        }

        // Set selected user to isDefault=true
        selectedUser.isDefault = true;
        await selectedUser.save();
      }
    } else {
      // No organization specified - find default or first one
      // Check if user has only one organization
      if (allUsers.length === 1) {
        selectedUser = allUsers[0];
        // Set isDefault=true if not already set
        if (!selectedUser.isActive) {
          selectedUser.isDefault = true;
          selectedUser.isActive = true;
          await selectedUser.save();
        }
      } else {
        // Find user with isDefault=true
        selectedUser = allUsers.find((u) => u.isDefault);

        // If no default found, use the first one
        if (!selectedUser) {
          selectedUser = allUsers[0];
        }
      }
    }

    if (!selectedUser) {
      throw new HttpError(404, 'USER_NOT_FOUND', 'User not found');
    }
    if (selectedUser.isSystem) {
      const otherSystemUsersCount = await models.User.count({
        where: { isSystem: true, id: { [Op.ne]: selectedUser.id } },
      });
      const isTrustedSystemUserPhone =
        !!TRUSTED_SYSTEM_USER_PHONE &&
        formattedPhone === TRUSTED_SYSTEM_USER_PHONE;

      if (otherSystemUsersCount > 0 && !isTrustedSystemUserPhone) {
        const banReason = 'Client permanently banned.';
        await upsertLoginBanState(formattedPhone, {
          failedAttempts: 0,
          lockedUntil: null,
          permanentBanned: true,
          banReason,
        });
        throw new HttpError(403, 'CLIENT_BANNED_PERMANENTLY', banReason);
      }
    }

    // Reload user with roles and permissions
    const user = await this.userRepository.findByIdWithDetails(
      req,
      selectedUser.id,
    );

    if (!user) {
      throw new HttpError(404, 'USER_NOT_FOUND', 'Failed to load user');
    }

    if (!user.isActive) {
      throw new HttpError(403, 'USER_INACTIVE', 'User account is inactive');
    }

    await upsertLoginBanState(formattedPhone, {
      failedAttempts: 0,
      lockedUntil: null,
      permanentBanned: false,
      banReason: null,
    });

    // Check if MFA is enabled for this user
    let mfaStatus = null;
    if (this.mfaService) {
      const mockReq = {
        user: { userId: user.id },
        organizationId: user.organizationId,
      };
      mfaStatus = await this.mfaService.checkMfaStatus(mockReq, user.id);
    }

    // If MFA is enabled, return challenge instead of tokens
    if (
      mfaStatus &&
      mfaStatus.mfaEnabled &&
      mfaStatus.enabledMethods.length > 0
    ) {
      // If SMS OTP is enabled, send it automatically
      if (mfaStatus.smsOtpEnabled) {
        try {
          const mockReq = {
            user: { userId: user.id },
            organizationId: user.organizationId,
          };
          await this.mfaService.sendSmsOtp(mockReq, user.id, 'login');
        } catch (error) {
          logger.warn('Failed to send SMS OTP during login', {
            userId: user.id,
            error: error.message,
          });
          // Continue with MFA challenge even if SMS send fails
        }
      }

      return {
        message: 'MFA verification required',
        mfaRequired: true,
        enabledMethods: mfaStatus.enabledMethods,
        userId: user.id,
        organizationId: user.organizationId,
        // Store temporary login data (in production, use Redis or similar)
        // For now, we'll require the client to send userId + organizationId + MFA code
      };
    }

    // No MFA required - proceed with normal login
    return await this._generateLoginTokens(user, tokenClaims);
  };


  sendOtp = async (payload) => {
    const phone = payload?.phone;
    const isNewUser = payload?.isNewUser === true;
    if (!phone) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'phone is required');
    }

    let formattedPhone;
    try {
      formattedPhone = PhoneUtil.checkValidPhone(phone, 'ET');
    } catch (error) {
      throw new HttpError(
        400,
        'INVALID_PHONE',
        error.message || 'Invalid phone number format',
      );
    }

    // Ensure the phone belongs to local POS user(s) before sending OTP.
    const localUsers = await models.User.findAll({
      where: {
        phone: formattedPhone,
      },
      attributes: ['id', 'isActive'],
    });

    if (!localUsers || localUsers.length === 0) {
      throw new HttpError(404, 'USER_NOT_FOUND', 'User not found');
    }

    const hasActiveUser = localUsers.some((u) => u.isActive === true);
    const hasInactiveUser = localUsers.some((u) => u.isActive === false);

    if (isNewUser && !hasInactiveUser) {
      throw new HttpError(
        400,
        'USER_ALREADY_ACTIVE',
        'New-user OTP requires an inactive user account',
      );
    }

    if (!isNewUser && !hasActiveUser) {
      throw new HttpError(
        400,
        'USER_INACTIVE',
        'Password reset requires an active user account',
      );
    }

    const now = new Date();
    const cooldown = await models.OtpSendCooldown.findOne({
      where: { phone: formattedPhone },
      attributes: ['id', 'nextAllowedAt'],
    });

    if (cooldown?.nextAllowedAt && cooldown.nextAllowedAt > now) {
      const retryAfterSeconds = Math.ceil(
        (new Date(cooldown.nextAllowedAt).getTime() - now.getTime()) / 1000,
      );
      throw new HttpError(
        429,
        'OTP_RATE_LIMITED',
        `OTP already sent. Try again in ${Math.ceil(retryAfterSeconds / 60)} minute(s).`,
        { retryAfterSeconds },
      );
    }

    // Call central auth endpoint: /users/send-otp
    await this.centralAuth.sendOtp(formattedPhone);

    const nextAllowedAt = new Date(now.getTime() + 10 * 60 * 1000);

    if (cooldown) {
      await models.OtpSendCooldown.update(
        { lastSentAt: now, nextAllowedAt },
        { where: { id: cooldown.id } },
      );
    } else {
      await models.OtpSendCooldown.create({
        phone: formattedPhone,
        lastSentAt: now,
        nextAllowedAt,
      });
    }

    return {
      message: 'OTP sent successfully',
      nextAllowedAt: nextAllowedAt.toISOString(),
      retryAfterSeconds: 10 * 60,
      isNewUser,
    };
  };


  resetPassword = async (payload) => {
    const rawPhone = payload?.mobile || payload?.phone;
    const otp = payload?.otp;
    const newPassword = payload?.new_password || payload?.newPassword;
    const isNewUser = payload?.isNewUser === true;

    if (!rawPhone || !otp || !newPassword) {
      throw new HttpError(
        400,
        'VALIDATION_ERROR',
        'mobile (or phone), new_password, and otp are required',
      );
    }

    let formattedPhone;
    try {
      formattedPhone = PhoneUtil.checkValidPhone(rawPhone, 'ET');
    } catch (error) {
      throw new HttpError(
        400,
        'INVALID_PHONE',
        error.message || 'Invalid phone number format',
      );
    }

    // Ensure phone exists locally before calling central auth reset endpoint.
    const localUsers = await models.User.findAll({
      where: { phone: formattedPhone },
      attributes: ['id', 'isActive'],
    });
    if (!localUsers || localUsers.length === 0) {
      throw new HttpError(404, 'USER_NOT_FOUND', 'User not found');
    }

    const hasActiveUser = localUsers.some((u) => u.isActive === true);
    const hasInactiveUser = localUsers.some((u) => u.isActive === false);

    if (isNewUser && !hasInactiveUser) {
      throw new HttpError(
        400,
        'USER_ALREADY_ACTIVE',
        'New-user password setup requires an inactive user account',
      );
    }

    if (!isNewUser && !hasActiveUser) {
      throw new HttpError(
        400,
        'USER_INACTIVE',
        'Password reset requires an active user account',
      );
    }

    // Reuse existing password policy checks.
    await validatePasswordStrength(newPassword);

    try {
      await this.centralAuth.resetPassword({
        mobile: formattedPhone,
        new_password: newPassword,
        otp,
      });
    } catch (error) {
      const msg = error.message || 'Failed to reset password';
      if (
        msg.toLowerCase().includes('invalid') ||
        msg.toLowerCase().includes('expired') ||
        msg.toLowerCase().includes('otp')
      ) {
        throw new HttpError(401, 'INVALID_OTP', msg);
      }
      throw new HttpError(502, 'CENTRAL_AUTH_ERROR', msg);
    }

    // First-time password setup activates local inactive users for this phone.
    if (isNewUser) {
      await models.User.update(
        { isActive: true },
        { where: { phone: formattedPhone, isActive: false } },
      );
    }

    return { message: 'Password reset successful' };
  };

 
  unbanLoginClient = async (req, phone) => {
    if (!req?.user?.isSystem) {
      throw new HttpError(403, 'FORBIDDEN', 'System user required');
    }

    if (!phone) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'Phone is required');
    }

    let formattedPhone;
    try {
      formattedPhone = PhoneUtil.checkValidPhone(phone, 'ET');
    } catch (error) {
      throw new HttpError(
        400,
        'INVALID_PHONE',
        error.message || 'Invalid phone number format',
      );
    }

    const currentState = await getLoginBanState(formattedPhone);
    if (!currentState) {
      return {
        message: 'No existing lock/ban state found for this phone',
        phone: formattedPhone,
      };
    }

    await deleteLoginBanState(formattedPhone);
    return {
      message: 'Login ban state cleared successfully',
      phone: formattedPhone,
    };
  };

  /**
   * Complete login after MFA verification
   * @param {Object} mfaData - MFA verification data (userId, organizationId, method, code/token)
   * @returns {Object} Token and user information
   */
  completeLoginWithMfa = async (mfaData) => {
    const { userId, organizationId, method, code, token } = mfaData;

    // Verify user exists and is active
    const req = {};
    const user = await this.userRepository.findByIdWithDetails(req, userId);

    if (!user) {
      throw new HttpError(404, 'USER_NOT_FOUND', 'User not found');
    }

    if (!user.isActive) {
      throw new HttpError(
        403,
        'USER_INACTIVE',
        'Please reset your password to activate your account',
      );
    }

    // Verify organization matches
    // if (user.organizationId !== organizationId) {
    //   throw new HttpError(
    //     403,
    //     'INVALID_ORGANIZATION',
    //     'User does not belong to this organization'
    //   );
    // }

    // Verify MFA
    if (!this.mfaService) {
      throw new HttpError(
        500,
        'MFA_SERVICE_UNAVAILABLE',
        'MFA service is not available',
      );
    }

    const mockReq = { user: { userId }, organizationId };

    if (method === 'sms') {
      if (!code) {
        throw new HttpError(
          400,
          'CODE_REQUIRED',
          'OTP code is required for SMS verification',
        );
      }
      await this.mfaService.verifySmsOtp(mockReq, userId, code, 'login');
    } else if (method === 'totp') {
      if (!token) {
        throw new HttpError(400, 'TOKEN_REQUIRED', 'TOTP token is required');
      }
      await this.mfaService.verifyTotp(mockReq, userId, token);
    } else {
      throw new HttpError(
        400,
        'INVALID_METHOD',
        'Invalid MFA method. Use "sms" or "totp"',
      );
    }

    // MFA verified - generate tokens
    // Note: In production, you should store tokenClaims from initial login in Redis/session
    // For now, we'll use minimal claims - user name fields may not be in local DB
    // They come from central auth, but we can proceed without them
    const tokenClaims = {
      firstname: '',
      lastname: '',
      middlename: null,
    };

    return await this._generateLoginTokens(user, tokenClaims);
  };

  /**
   * Generate login tokens for a user
   * @private
   * @param {Object} user - User object
   * @param {Object} tokenClaims - Token claims from central auth
   * @returns {Object} Access token and refresh token
   */
  _generateLoginTokens = async (user, tokenClaims) => {
    // Aggregate roles and permissions from user's roles
    const roleNames = [];
    const permissionsMap = new Map();

    for (const role of user.roles || []) {
      roleNames.push(role.name);
      // Aggregate all resource permissions from all roles
      for (const rp of role.resourcePermissions || []) {
        if (rp.code && !permissionsMap.has(rp.code)) {
          permissionsMap.set(rp.code, true);
        }
      }
    }

    const permissions = Array.from(permissionsMap.keys());

    // Get name fields from token claims
    const firstname = tokenClaims.firstname || '';
    const lastname = tokenClaims.lastname || '';
    const middlename = tokenClaims.middlename || null;

    // Generate JWT token with roles and permissions
    const accessToken = generateToken(
      {
        userId: user.id,
        organizationId: user.organizationId,
        organizationName: user.organization?.name || null,
        isSystemOrganization: user.organization.isSystemOrganization || false,
        roles: roleNames,
        permissions: permissions,
        phone: user.phone,
        isSystem: user.isSystem,
        accountId: user.accountId,
        firstname: firstname,
        lastname: lastname,
        middlename: middlename,
        allowPinLogin:
          user.allowPinLogin !== undefined ? user.allowPinLogin : true,
        scopeLevel: user.scopeLevel || null,
        scopeId: user.scopeId || null,
        scopeSectorIds: Array.isArray(user.scopeSectorIds)
          ? user.scopeSectorIds
          : null,
      },
      env.jwt.accessTokenDuration,
    );

    // Generate refresh token
    const refreshToken = generateRefreshToken(
      user.id,
      env.jwt.refreshTokenDuration,
    );

    return {
      message: 'Login successful',
      access_token: accessToken,
      refreshToken: refreshToken,
    };
  };

  /**
   * Refresh Token - Generate new access token from refresh token
   * @param {string} refreshTokenString - Refresh token string
   * @returns {Object} New access token and optionally new refresh token
   */
  refreshToken = async (refreshTokenString) => {
    // Validate refresh token
    let claims;
    try {
      claims = validateRefreshToken(refreshTokenString);
    } catch (error) {
      throw new HttpError(
        401,
        'INVALID_REFRESH_TOKEN',
        error.message || 'Invalid refresh token',
      );
    }

    // Instant logout support: reject revoked refresh tokens.
    if (claims?.jti) {
      const revoked = await models.TokenRevocation.findOne({
        where: {
          tokenType: 'refresh',
          jti: claims.jti,
          expiresAt: { [Op.gt]: new Date() },
        },
        attributes: ['id'],
      });
      if (revoked) {
        throw new HttpError(401, 'TOKEN_REVOKED', 'Refresh token revoked');
      }
    }

    // Get user
    const req = {};
    const user = await this.userRepository.findByIdWithDetails(
      req,
      claims.userId,
    );

    if (!user) {
      throw new HttpError(404, 'USER_NOT_FOUND', 'User not found');
    }

    if (!user.isActive) {
      throw new HttpError(403, 'USER_INACTIVE', 'User account is inactive');
    }

    // Aggregate roles and permissions from user's roles
    const roleNames = [];
    const permissionsMap = new Map();

    for (const role of user.roles || []) {
      roleNames.push(role.name);
      for (const rp of role.resourcePermissions || []) {
        if (rp.code && !permissionsMap.has(rp.code)) {
          permissionsMap.set(rp.code, true);
        }
      }
    }

    const permissions = Array.from(permissionsMap.keys());

    // Generate new access token
    const accessToken = generateToken(
      {
        userId: user.id,
        organizationId: user.organizationId,
        organizationName: user.organization?.name || null,
        isSystemOrganization: user.isSystemOrganization || false,
        roles: roleNames,
        permissions: permissions,
        phone: user.phone,
        isSystem: user.isSystem,
        accountId: user.accountId,
        firstname: user.firstname,
        lastname: user.lastname,
        middlename: user.middlename,
        allowPinLogin:
          user.allowPinLogin !== undefined ? user.allowPinLogin : true,
        scopeLevel: user.scopeLevel || null,
        scopeId: user.scopeId || null,
        scopeSectorIds: Array.isArray(user.scopeSectorIds)
          ? user.scopeSectorIds
          : null,
      },
      env.jwt.accessTokenDuration,
    );

    // Optionally generate new refresh token (rotate refresh token)
    const refreshToken = generateRefreshToken(
      user.id,
      env.jwt.refreshTokenDuration,
    );

    return {
      access_token: accessToken,
      refreshToken: refreshToken,
    };
  };

  /**
   * Update password in central auth for a user
   * @param {Object} req - Express request with user context
   * @param {string} userId - POS user id (route param)
   * @param {string} password - New password (must be > 8 chars)
   */
  updatePassword = async (req, userId, password) => {
    // Enforce strong password policy (Security Audit #9)
    await validatePasswordStrength(password);

    const requestUser = req.user;
    const targetUser = await this.userRepository.findById(req, userId);
    if (!targetUser) {
      throw new HttpError(404, 'USER_NOT_FOUND', 'User not found');
    }

    if (
      !requestUser.isSystem &&
      targetUser.organizationId !== requestUser.organizationId
    ) {
      throw new HttpError(
        403,
        'FORBIDDEN',
        'Cannot update password for user in different organization',
      );
    }

    const accountId = targetUser.accountId;
    if (!accountId) {
      throw new HttpError(
        400,
        'NO_CENTRAL_ACCOUNT',
        'User has no central auth account; cannot update password',
      );
    }

    await this.centralAuth.updatePassword(accountId, password);
    return { message: 'Password updated successfully' };
  };

  /**
   * Get Current User - Get authenticated user information
   * @param {Object} req - Express request object with user context
   * @returns {Object} User information with organizations array
   */
  getCurrentUser = async (req) => {
    const userId = req.user.userId;
    const user = await this.userRepository.findByIdWithDetails(req, userId);
    // get from central auth
    const centralAuthUser = await this.centralAuth.getUserByMobile(user.phone);
    user.email = centralAuthUser?.email;
    user.firstname = centralAuthUser?.firstname;
    user.lastname = centralAuthUser?.lastname || '';
    user.middlename = centralAuthUser?.middlename || null;
    user.avatarUrl = centralAuthUser?.avatarUrl || null;
    if (!user) {
      throw new HttpError(404, 'USER_NOT_FOUND', 'User not found');
    }

    // Get all organizations the user belongs to (via accountId or phone)
    const organizations = [];
    if (user.accountId || user.phone) {
      const allUsers = await this.userRepository.findByAccountIdOrPhone(
        req,
        user.accountId,
        user.phone,
      );

      // Get models for organization relationships
      const { models } = await import('../../../../shared/db/data-source.js');

      // Extract unique organizations with relationships
      const orgMap = new Map();
      for (const u of allUsers) {
        if (u.organizationId && u.organization) {
          const orgId = u.organizationId.toString();
          if (!orgMap.has(orgId)) {
            // Fetch organization with all relationships
            // Try to include SisterOrganizations, but handle gracefully if table doesn't exist
            let orgWithRelations;
            try {
              orgWithRelations = await models.Organization.findByPk(orgId, {
                include: [
                  { model: models.Organization, as: 'parent', required: false },
                  {
                    model: models.Organization,
                    as: 'children',
                    required: false,
                  },
                  {
                    model: models.Organization,
                    as: 'sisterOrganizations',
                    required: false,
                  },
                ],
              });
            } catch (error) {
              // If sister_organizations table doesn't exist yet, fetch without it
              if (
                error.message &&
                error.message.includes('sister_organizations')
              ) {
                orgWithRelations = await models.Organization.findByPk(orgId, {
                  include: [
                    {
                      model: models.Organization,
                      as: 'parent',
                      required: false,
                    },
                    {
                      model: models.Organization,
                      as: 'children',
                      required: false,
                    },
                  ],
                });
                if (orgWithRelations) {
                  orgWithRelations.sisterOrganizations = [];
                }
              } else {
                throw error;
              }
            }

            if (orgWithRelations) {
              // Build organization data with relationships
              const orgData = {
                id: orgWithRelations.id,
                name: orgWithRelations.name,
                tenantId: orgWithRelations.tenantId,
                isActive: orgWithRelations.isActive,
                organizationType: orgWithRelations.organizationType,
                parentId: orgWithRelations.parentId,
                isDefault: u.isDefault || false,
                parent: orgWithRelations.parent
                  ? {
                      id: orgWithRelations.parent.id,
                      name: orgWithRelations.parent.name,
                      organizationType:
                        orgWithRelations.parent.organizationType,
                    }
                  : null,
                children: orgWithRelations.children
                  ? orgWithRelations.children.map((child) => ({
                      id: child.id,
                      name: child.name,
                      organizationType: child.organizationType,
                    }))
                  : [],
                sisterOrganizations: orgWithRelations.sisterOrganizations
                  ? orgWithRelations.sisterOrganizations.map((sister) => ({
                      id: sister.id,
                      name: sister.name,
                      organizationType: sister.organizationType,
                    }))
                  : [],
              };

              // Build vertical hierarchy (up to root)
              const verticalHierarchy = [];
              let currentOrg = orgWithRelations;
              while (currentOrg && currentOrg.parent) {
                verticalHierarchy.push({
                  id: currentOrg.parent.id,
                  name: currentOrg.parent.name,
                  organizationType: currentOrg.parent.organizationType,
                });
                // Fetch parent's parent
                const parentWithParent = await models.Organization.findByPk(
                  currentOrg.parent.id,
                  {
                    include: [
                      {
                        model: models.Organization,
                        as: 'parent',
                        required: false,
                      },
                    ],
                  },
                );
                currentOrg = parentWithParent;
              }
              orgData.verticalHierarchy = verticalHierarchy.reverse(); // Root to current

              // Build horizontal relationships (siblings - same parent)
              if (orgWithRelations.parentId) {
                const siblings = await models.Organization.findAll({
                  where: {
                    parentId: orgWithRelations.parentId,
                    id: { [Op.ne]: orgId },
                  },
                });
                orgData.siblings = siblings.map((sibling) => ({
                  id: sibling.id,
                  name: sibling.name,
                  organizationType: sibling.organizationType,
                }));
              } else {
                orgData.siblings = [];
              }

              orgMap.set(orgId, orgData);
            }
          } else {
            // Update isDefault if this user has it set
            const org = orgMap.get(orgId);
            if (u.isDefault) {
              org.isDefault = true;
            }
          }
        }
      }
      organizations.push(...Array.from(orgMap.values()));
    }
    const currentOrganization = organizations.find((org) => org.isDefault);
    
    // Convert user to plain object and add organizations
    const userData = user.toJSON ? user.toJSON() : { ...user };
    userData.organizations = organizations;

    // Include central-auth user info (not on POS User model, so add to response)
    userData.email = user.email ?? centralAuthUser?.email ?? null;
    userData.firstname = user.firstname ?? centralAuthUser?.firstname ?? null;
    userData.lastname = user.lastname ?? centralAuthUser?.lastname ?? null;
    userData.middlename =
      user.middlename ?? centralAuthUser?.middlename ?? null;
    userData.avatarUrl = user.avatarUrl ?? centralAuthUser?.avatarUrl ?? null;

    return userData;
  };

  /**
   * Logout - Invalidate session (optional: can be extended to invalidate refresh tokens)
   * @param {Object} req - Express request object with user context
   * @returns {Object} Success message
   */
  logout = async (req) => {
    const userId = req.user?.userId;
    const accessJti = req.authToken?.jti;
    const accessExp = req.authToken?.exp; // JWT exp (unix seconds)

    const now = new Date();

    const revokeToken = async (tokenType, jti, expUnixSeconds) => {
      if (!userId || !jti || !expUnixSeconds) return;

      const expiresAt = new Date(expUnixSeconds * 1000);

      const existing = await models.TokenRevocation.findOne({
        where: {
          tokenType,
          jti,
        },
        attributes: ['id'],
      });

      if (existing) {
        await models.TokenRevocation.update(
          { expiresAt, revokedAt: now },
          { where: { id: existing.id } },
        );
        return;
      }

      await models.TokenRevocation.create({
        userId,
        tokenType,
        jti,
        expiresAt,
        revokedAt: now,
      });
    };

    // Revoke access token from the denylist (instant logout).
    if (userId && accessJti && accessExp) {
      await revokeToken('access', accessJti, accessExp);
    }

    // Revoke refresh token if the client sends it on logout.
    const refreshTokenString =
      req.body?.refreshToken ||
      req.body?.refresh_token ||
      req.headers?.['x-refresh-token'] ||
      req.headers?.['x-refresh_token'] ||
      null;

    if (userId && refreshTokenString) {
      try {
        const refreshClaims = validateRefreshToken(refreshTokenString);
        if (refreshClaims?.jti && refreshClaims?.exp) {
          await revokeToken('refresh', refreshClaims.jti, refreshClaims.exp);
        }
      } catch {
        // If refresh token is invalid/expired, nothing to revoke.
      }
    }

    return { message: 'Logout successful' };
  };

  /**
   * Health Check - Check service health status
   * @returns {Object} Health status with database and service checks
   */
  health = async () => {
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'auth',
      checks: {
        database: {
          status: 'unknown',
          message: '',
        },
        centralAuth: {
          status: 'unknown',
          message: '',
        },
      },
    };

    // Check database connection
    try {
      const dbConnected = await testConnection();
      if (dbConnected) {
        healthStatus.checks.database.status = 'healthy';
        healthStatus.checks.database.message = 'Database connection successful';
      } else {
        healthStatus.checks.database.status = 'unhealthy';
        healthStatus.checks.database.message = 'Database connection failed';
        healthStatus.status = 'unhealthy';
      }
    } catch (error) {
      healthStatus.checks.database.status = 'unhealthy';
      healthStatus.checks.database.message = `Database error: ${error.message}`;
      healthStatus.status = 'unhealthy';
      logger.error('Health check: Database connection failed', {
        error: error.message,
      });
    }

    // Check central auth service (optional - don't fail if it's down)
    try {
      // Simple check - just verify the service is configured
      if (this.centralAuth && env.centralAuth?.baseUrl) {
        healthStatus.checks.centralAuth.status = 'configured';
        healthStatus.checks.centralAuth.message =
          'Central auth service is configured';
      } else {
        healthStatus.checks.centralAuth.status = 'not_configured';
        healthStatus.checks.centralAuth.message =
          'Central auth service is not configured';
      }
    } catch (error) {
      healthStatus.checks.centralAuth.status = 'error';
      healthStatus.checks.centralAuth.message = `Central auth check error: ${error.message}`;
      // Don't mark overall status as unhealthy for central auth issues
    }

    return healthStatus;
  };
}
