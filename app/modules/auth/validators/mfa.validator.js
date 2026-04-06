import * as yup from 'yup';

/** POST /mfa/sms/send (may be anonymous) */
export const mfaSendSmsOtpBodySchema = yup.object({
  userId: yup.string().uuid().required(),
  purpose: yup.string().trim().optional(),
});

/** POST /mfa/sms/verify */
export const mfaVerifySmsOtpBodySchema = yup.object({
  userId: yup.string().uuid().required(),
  otp: yup.string().required(),
  purpose: yup.string().trim().optional(),
});

/** POST /mfa/totp/verify */
export const mfaTotpVerifyBodySchema = yup.object({
  token: yup.string().required(),
});

/** POST /mfa/totp/toggle */
export const mfaTotpToggleBodySchema = yup.object({
  enabled: yup.boolean().required(),
});

/** POST /mfa/totp/verify-login */
export const mfaTotpVerifyLoginBodySchema = yup.object({
  userId: yup.string().uuid().required(),
  token: yup.string().required(),
});

/** GET /mfa/status/:userId */
export const mfaStatusUserIdParamSchema = yup.object({
  userId: yup.string().uuid().required(),
});

/** POST /mfa/organizations/remove (body when not using :organizationId route) */
export const mfaRemoveOrgBodySchema = yup.object({
  organizationId: yup.string().uuid().required(),
});
