import * as yup from 'yup';

/** POST /auth/send-otp */
export const sendOtpBodySchema = yup.object({
  phone: yup.string().trim().required(),
  isNewUser: yup.boolean().optional(),
});

/** POST /auth/reset-password — coalesce phone/mobile for auth.service */
export const resetPasswordBodySchema = yup
  .object({
    otp: yup.string().required(),
    newPassword: yup.string().required(),
    isNewUser: yup.boolean().optional(),
    phone: yup.string().trim().optional(),
    mobile: yup.string().trim().optional(),
  })
  .test(
    'phone-or-mobile',
    'phone or mobile is required',
    (v) => !!(v && (String(v.phone || '').trim() || String(v.mobile || '').trim())),
  )
  .transform((v) => ({
    otp: v.otp,
    newPassword: v.newPassword,
    isNewUser: v.isNewUser,
    phone: String(v.phone || v.mobile || '').trim(),
  }));

/** POST /auth/login/mfa */
export const completeLoginWithMfaBodySchema = yup
  .object({
    userId: yup.string().uuid().required(),
    organizationId: yup.string().uuid().optional(),
    method: yup.string().oneOf(['sms', 'totp']).required(),
    code: yup.string().optional(),
    token: yup.string().optional(),
  })
  .test(
    'mfa-credentials',
    'SMS requires code; TOTP requires token',
    (v) => {
      if (!v) return false;
      if (v.method === 'sms') return !!(v.code && String(v.code).length > 0);
      if (v.method === 'totp') return !!(v.token && String(v.token).length > 0);
      return false;
    },
  );

/** PUT /auth/password/update/:id */
export const updatePasswordBodySchema = yup.object({
  password: yup.string().required(),
});

/** POST /system/login-bans/unban */
export const unbanLoginClientBodySchema = yup.object({
  phone: yup.string().trim().required(),
});
