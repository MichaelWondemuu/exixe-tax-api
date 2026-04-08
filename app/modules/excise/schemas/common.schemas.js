import { yup } from '../../../shared/middleware/validate.middleware.js';

export const idParamsSchema = yup.object({
  id: yup.string().uuid().required(),
});

