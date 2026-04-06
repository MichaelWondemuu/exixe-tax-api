import { MfaResponse } from '../usecases/mfas/mfa.response.js';

export class MfaController {
  constructor({ mfaQueryService, mfaCommandService }) {
    this.mfaQueryService = mfaQueryService;
    this.mfaCommandService = mfaCommandService;
  }

  /**
   * Get MFA settings for current user
   * GET /mfa/settings
   */
  getMfaSettings = async (req, res, next) => {
    try {
      const data = await this.mfaQueryService.getMfaSettings(req);
      res.json(MfaResponse.toSettings(data));
    } catch (error) {
      next(error);
    }
  };

  /**
   * Enable SMS OTP
   * POST /mfa/sms/enable
   */
  enableSmsOtp = async (req, res, next) => {
    try {
      const data = await this.mfaCommandService.enableSmsOtp(req);
      res.json(MfaResponse.toSmsOtpToggle(data));
    } catch (error) {
      next(error);
    }
  };

  /**
   * Disable SMS OTP
   * POST /mfa/sms/disable
   */
  disableSmsOtp = async (req, res, next) => {
    try {
      const data = await this.mfaCommandService.disableSmsOtp(req);
      res.json(MfaResponse.toSmsOtpToggle(data));
    } catch (error) {
      next(error);
    }
  };

  /**
   * Initiate TOTP setup
   * POST /mfa/totp/initiate
   */
  initiateTotpSetup = async (req, res, next) => {
    try {
      const data = await this.mfaCommandService.initiateTotpSetup(req);
      res.json(MfaResponse.toTotpInitiate(data));
    } catch (error) {
      next(error);
    }
  };

  /**
   * Verify and enable TOTP
   * POST /mfa/totp/verify
   */
  verifyAndEnableTotp = async (req, res, next) => {
    try {
      const { token } = req.body;
      if (!token) {
        return res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: 'Token is required',
        });
      }

      const data = await this.mfaCommandService.verifyAndEnableTotp(
        req,
        token,
      );
      res.json(MfaResponse.toTotpVerified(data));
    } catch (error) {
      next(error);
    }
  };

  /**
   * Disable TOTP
   * POST /mfa/totp/disable
   */
  disableTotp = async (req, res, next) => {
    try {
      const data = await this.mfaCommandService.disableTotp(req);
      res.json(MfaResponse.toTotpDisabled(data));
    } catch (error) {
      next(error);
    }
  };

  /**
   * Toggle TOTP enabled state
   * POST /mfa/totp/toggle
   */
  toggleTotpEnabled = async (req, res, next) => {
    try {
      const { enabled } = req.body;
      if (typeof enabled !== 'boolean') {
        return res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: 'enabled must be a boolean (true or false)',
        });
      }

      const data = await this.mfaCommandService.toggleTotpEnabled(
        req,
        enabled,
      );
      res.json(MfaResponse.toTotpToggle(data));
    } catch (error) {
      next(error);
    }
  };

  /**
   * Send SMS OTP (for login verification)
   * POST /mfa/sms/send
   */
  sendSmsOtp = async (req, res, next) => {
    try {
      const { userId, purpose } = req.body;
      if (!userId) {
        return res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: 'userId is required',
        });
      }

      const data = await this.mfaCommandService.sendSmsOtp(
        req,
        userId,
        purpose || 'login',
      );
      res.json(MfaResponse.toSendSmsOtp(data));
    } catch (error) {
      next(error);
    }
  };

  /**
   * Verify SMS OTP (for login verification)
   * POST /mfa/sms/verify
   */
  verifySmsOtp = async (req, res, next) => {
    try {
      const { userId, otp, purpose } = req.body;
      if (!userId || !otp) {
        return res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: 'userId and otp are required',
        });
      }

      const data = await this.mfaCommandService.verifySmsOtp(
        req,
        userId,
        otp,
        purpose || 'login',
      );
      res.json(MfaResponse.toVerifyOtp(data));
    } catch (error) {
      next(error);
    }
  };

  /**
   * Verify TOTP (for login verification)
   * POST /mfa/totp/verify-login
   */
  verifyTotp = async (req, res, next) => {
    try {
      const { userId, token } = req.body;
      if (!userId || !token) {
        return res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: 'userId and token are required',
        });
      }

      const data = await this.mfaCommandService.verifyTotp(
        req,
        userId,
        token,
      );
      res.json(MfaResponse.toVerifyTotp(data));
    } catch (error) {
      next(error);
    }
  };

  /**
   * Check MFA status for a user
   * GET /mfa/status/:userId
   */
  checkMfaStatus = async (req, res, next) => {
    try {
      const { userId } = req.params;
      if (!userId) {
        return res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: 'userId is required',
        });
      }

      const data = await this.mfaQueryService.checkMfaStatus(req, userId);
      res.json(MfaResponse.toStatus(data));
    } catch (error) {
      next(error);
    }
  };

  /**
   * Add current organization to MFA-required list (login with this org will require MFA).
   * POST /mfa/organizations/add
   */
  addOrganizationToMfa = async (req, res, next) => {
    try {
      const data = await this.mfaCommandService.addOrganizationToMfa(req);
      res.json(MfaResponse.toOrganizationMfaList(data));
    } catch (error) {
      next(error);
    }
  };

  /**
   * Remove an organization from MFA-required list.
   * POST /mfa/organizations/remove or POST /mfa/organizations/:organizationId/remove
   */
  removeOrganizationFromMfa = async (req, res, next) => {
    try {
      const organizationId =
        req.params.organizationId || req.body?.organizationId;
      const data = await this.mfaCommandService.removeOrganizationFromMfa(
        req,
        organizationId,
      );
      res.json(MfaResponse.toOrganizationMfaList(data));
    } catch (error) {
      next(error);
    }
  };
}
