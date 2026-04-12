import { yup } from '../../../shared/middleware/validate.middleware.js';
import { PRODUCT_RECALL_SEVERITY } from '../constants/enforcement.enums.js';

export const productRecallCreateBodySchema = yup.object({
  title: yup.string().trim().min(1).max(500).required(),
  description: yup.string().trim().max(20000).nullable(),
  severity: yup
    .string()
    .oneOf(Object.values(PRODUCT_RECALL_SEVERITY))
    .default(PRODUCT_RECALL_SEVERITY.MEDIUM),
  productId: yup.string().uuid().required(),
  productVariantId: yup.string().uuid().nullable(),
  lotOrBatchCode: yup.string().trim().max(128).nullable(),
  subjectOrganizationId: yup.string().uuid().nullable(),
  effectiveFrom: yup.date().nullable(),
  effectiveTo: yup.date().nullable(),
});

export const productRecallPatchBodySchema = yup
  .object({
    title: yup.string().trim().min(1).max(500).nullable(),
    description: yup.string().trim().max(20000).nullable(),
    severity: yup.string().oneOf(Object.values(PRODUCT_RECALL_SEVERITY)),
    productVariantId: yup.string().uuid().nullable(),
    lotOrBatchCode: yup.string().trim().max(128).nullable(),
    subjectOrganizationId: yup.string().uuid().nullable(),
    effectiveFrom: yup.date().nullable(),
    effectiveTo: yup.date().nullable(),
  })
  .test(
    'non-empty-patch',
    'At least one field is required',
    (value) => value != null && Object.keys(value).length > 0,
  );

export const recallsActiveQuerySchema = yup.object({
  productId: yup.string().uuid().required(),
  productVariantId: yup.string().uuid().nullable(),
  lotOrBatchCode: yup.string().trim().max(128).nullable(),
});
