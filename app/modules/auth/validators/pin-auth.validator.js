import * as yup from 'yup';

/** POST /pin-auth/verify (after mergePinVerifyBody) */
export const pinVerifyBodySchema = yup.object({
  userId: yup.string().trim().required(),
  pin: yup.string().required(),
});

/** POST /pin-auth/set */
export const pinSetBodySchema = yup.object({
  pin: yup.string().required(),
  oldPin: yup.string().optional(),
});
