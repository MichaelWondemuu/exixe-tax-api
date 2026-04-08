import { yup } from '../../../shared/middleware/validate.middleware.js';

const forecastMonthItemSchema = yup.object({
  month: yup.string().matches(/^\d{4}-\d{2}$/).required(),
  quantity: yup.number().integer().min(0).required(),
});

export const forecastBodySchema = yup.object({
  facilityId: yup.string().uuid().required(),
  goodsCategory: yup.string().trim().min(1).max(128).required(),
  monthlyPlan: yup.array().of(forecastMonthItemSchema).length(6).required(),
});

export const forecastPatchSchema = yup.object({
  goodsCategory: yup.string().trim().min(1).max(128),
  monthlyPlan: yup.array().of(forecastMonthItemSchema).length(6),
});

