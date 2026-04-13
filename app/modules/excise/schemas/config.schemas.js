import { yup } from '../../../shared/middleware/validate.middleware.js';

export const exciseConfigKeyParamsSchema = yup.object({
  key: yup.string().trim().min(2).max(128).required(),
});

export const exciseConfigCreateBodySchema = yup.object({
  key: yup.string().trim().min(2).max(128).required(),
  value: yup.mixed().required(),
  description: yup.string().trim().max(500).nullable(),
  isEditable: yup.boolean().default(true),
});

export const exciseConfigUpdateBodySchema = yup.object({
  value: yup.mixed().required(),
  description: yup.string().trim().max(500).nullable(),
  isEditable: yup.boolean(),
});
