import { yup } from '../../../shared/middleware/validate.middleware.js';

export const stockSnapshotBodySchema = yup.object({
  organizationId: yup.string().uuid().nullable(),
  facilityId: yup.string().uuid().required(),
  productId: yup.string().uuid().required(),
  productVariantId: yup.string().uuid().nullable(),
  lotOrBatchCode: yup.string().trim().max(128).nullable(),
  quantityOnHand: yup.number().min(0).required(),
  countedAt: yup.date().required(),
  remarks: yup.string().trim().max(5000).nullable(),
  evidence: yup.object().nullable(),
});

export const stockSnapshotPatchSchema = yup
  .object({
    facilityId: yup.string().uuid().nullable(),
    productId: yup.string().uuid().nullable(),
    productVariantId: yup.string().uuid().nullable(),
    lotOrBatchCode: yup.string().trim().max(128).nullable(),
    quantityOnHand: yup.number().min(0).nullable(),
    countedAt: yup.date().nullable(),
    remarks: yup.string().trim().max(5000).nullable(),
    evidence: yup.object().nullable(),
  })
  .test(
    'non-empty-patch',
    'At least one field is required',
    (value) => value != null && Object.keys(value).length > 0,
  );
