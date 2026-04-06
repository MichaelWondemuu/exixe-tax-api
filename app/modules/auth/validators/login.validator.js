import * as yup from 'yup';

/** POST /auth/login */
export const loginBodySchema = yup
  .object({
    phone: yup.string().trim().required('Phone number is required'),
    password: yup.string().optional(),
    pin: yup.string().optional(),
    organizationId: yup.string().trim().optional(),
    isDefault: yup.boolean().optional(),
  })
  .transform((d) => ({
    phone: d.phone,
    password: d.password ?? d.pin ?? null,
    organizationId: d.organizationId,
    isDefault: d.isDefault,
  }))
  .test(
    'password-or-pin',
    'Password/PIN is required',
    (v) => v.password != null && String(v.password).length > 0,
  );
