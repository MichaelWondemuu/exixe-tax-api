import { createAsyncRouter } from '../../../shared/middleware/exception.handler.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { MfaController } from '../controllers/mfa.controller.js';
import { MfaQueryService } from '../usecases/mfas/mfa.query.js';
import { MfaCommandService } from '../usecases/mfas/mfa.command.js';
import {
  MfaRepository,
  OtpCodeRepository,
} from '../repository/mfa.repository.js';
import { UserRepository } from '../repository/user.repository.js';

const router = createAsyncRouter();

// Initialize repositories
const mfaRepository = new MfaRepository();
const otpCodeRepository = new OtpCodeRepository();
const userRepository = new UserRepository();

const mfaQueryService = new MfaQueryService({
  mfaRepository,
  otpCodeRepository,
  userRepository,
});
const mfaCommandService = new MfaCommandService({
  mfaRepository,
  otpCodeRepository,
  userRepository,
});

// Initialize controller
const mfaController = new MfaController({
  mfaQueryService,
  mfaCommandService,
});
router.post('/sms/send', mfaController.sendSmsOtp);
// All MFA routes require authentication
router.use(authMiddleware());

// MFA Settings
router.get('/settings', mfaController.getMfaSettings);

// SMS OTP routes
router.post('/sms/enable', mfaController.enableSmsOtp);
router.post('/sms/disable', mfaController.disableSmsOtp);
router.post('/sms/verify', mfaController.verifySmsOtp);

// TOTP routes
router.post('/totp/initiate', mfaController.initiateTotpSetup);
router.post('/totp/verify', mfaController.verifyAndEnableTotp);
router.post('/totp/disable', mfaController.disableTotp);
router.post('/totp/toggle', mfaController.toggleTotpEnabled);
router.post('/totp/verify-login', mfaController.verifyTotp);

// MFA Status check
router.get('/status/:userId', mfaController.checkMfaStatus);

// MFA per-organization: add/remove org to require MFA when logging in with that org
router.post('/organizations/add', mfaController.addOrganizationToMfa);
router.post('/organizations/remove', mfaController.removeOrganizationFromMfa);
router.post(
  '/organizations/:organizationId/remove',
  mfaController.removeOrganizationFromMfa,
);

export default router;
