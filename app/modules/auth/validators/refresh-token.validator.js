import * as yup from 'yup';

/** POST /auth/refresh */
export const refreshTokenBodySchema = yup.object({
  refreshToken: yup.string().trim().required('Refresh token is required'),
});
