import { yup } from '../../../shared/middleware/validate.middleware.js';
import { SUSPICIOUS_PRODUCT_REPORT_STATUS } from '../constants/enforcement.enums.js';
import { idParamsSchema } from './counterfeit.schemas.js';

export { idParamsSchema };

export const suspiciousProductReportBodySchema = yup.object({
  productId: yup.string().uuid().required(),
  description: yup.string().trim().min(1).max(20000).required(),
  subjectOrganizationId: yup.string().uuid().nullable(),
  reporterName: yup.string().trim().max(255).nullable(),
  reporterEmail: yup.string().trim().email().max(255).nullable(),
  reporterPhone: yup.string().trim().max(64).nullable(),
  facilityId: yup.string().uuid().nullable(),
  stampIdentifier: yup.string().trim().max(256).nullable(),
  evidence: yup.object().nullable(),
});

export const suspiciousProductReportStatusPatchSchema = yup.object({
  status: yup
    .string()
    .oneOf(Object.values(SUSPICIOUS_PRODUCT_REPORT_STATUS))
    .required(),
});
