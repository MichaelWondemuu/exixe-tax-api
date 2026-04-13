import { yup } from '../../../shared/middleware/validate.middleware.js';

export const productionRecordBodySchema = yup.object({
  organizationId: yup.string().uuid().nullable(),
  facilityId: yup.string().uuid().required(),
  productId: yup.string().uuid().required(),
  productVariantId: yup.string().uuid().nullable(),
  lotOrBatchCode: yup.string().trim().max(128).nullable(),
  actualProducedQty: yup.number().positive().required(),
  producedAt: yup.date().required(),
  remarks: yup.string().trim().max(5000).nullable(),
  evidence: yup.object().nullable(),
});

export const productionRecordPatchSchema = yup
  .object({
    facilityId: yup.string().uuid().nullable(),
    productId: yup.string().uuid().nullable(),
    productVariantId: yup.string().uuid().nullable(),
    lotOrBatchCode: yup.string().trim().max(128).nullable(),
    actualProducedQty: yup.number().positive().nullable(),
    producedAt: yup.date().nullable(),
    remarks: yup.string().trim().max(5000).nullable(),
    evidence: yup.object().nullable(),
  })
  .test(
    'non-empty-patch',
    'At least one field is required',
    (value) => value != null && Object.keys(value).length > 0,
  );
