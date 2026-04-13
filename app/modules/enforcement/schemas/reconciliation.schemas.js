import { yup } from '../../../shared/middleware/validate.middleware.js';
import { RECONCILIATION_ITEM_SEVERITY } from '../constants/enforcement.enums.js';

export const reconciliationRunCreateBodySchema = yup.object({
  organizationId: yup.string().uuid().required(),
  facilityId: yup.string().uuid().nullable(),
  periodStart: yup.date().required(),
  periodEnd: yup.date().required(),
});

export const reconciliationRunItemsQuerySchema = yup.object({
  severity: yup
    .string()
    .oneOf(Object.values(RECONCILIATION_ITEM_SEVERITY))
    .nullable(),
  productId: yup.string().uuid().nullable(),
  facilityId: yup.string().uuid().nullable(),
  limit: yup.number().integer().min(1).max(200).nullable(),
  offset: yup.number().integer().min(0).nullable(),
});
