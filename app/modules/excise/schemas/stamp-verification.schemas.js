import { yup } from '../../../shared/middleware/validate.middleware.js';
import {
  STAMP_VERIFICATION_ACTOR_TYPE,
  STAMP_VERIFICATION_CHANNEL,
  STAMP_VERIFICATION_RESULT,
} from '../constants/excise.enums.js';

export const stampVerificationBodySchema = yup.object({
  verificationId: yup.string().uuid().nullable(),
  actorType: yup.string().oneOf(Object.values(STAMP_VERIFICATION_ACTOR_TYPE)).nullable(),
  facilityId: yup.string().uuid().nullable(),
  channel: yup.string().oneOf(Object.values(STAMP_VERIFICATION_CHANNEL)).required(),
  result: yup.string().oneOf(Object.values(STAMP_VERIFICATION_RESULT)).nullable(),
  stampIdentifier: yup.string().trim().min(1).max(256).nullable(),
  qrUrl: yup
    .string()
    .trim()
    .max(1024)
    .matches(/^https?:\/\/\S+$/i, 'qrUrl must be a valid http(s) URL')
    .nullable(),
  productDescription: yup.string().trim().max(255).nullable(),
  buyingProductName: yup.string().trim().max(255).nullable(),
  supplierName: yup.string().trim().max(255).nullable(),
  supplierDocumentType: yup.string().trim().max(64).nullable(),
  supplierDocumentNumber: yup.string().trim().max(128).nullable(),
  verificationEvidence: yup.object().nullable(),
  remarks: yup.string().trim().max(5000).nullable(),
  merchantName: yup.string().trim().max(255).nullable(),
  address: yup.string().trim().max(255).nullable(),
  city: yup.string().trim().max(128).nullable(),
  region: yup.string().trim().max(128).nullable(),
  woreda: yup.string().trim().max(128).nullable(),
  latitude: yup.number().min(-90).max(90).nullable(),
  longitude: yup.number().min(-180).max(180).nullable(),
  verifiedAt: yup.date().nullable(),
})
  .test(
    'stampIdentifier-or-qrUrl-required',
    'verificationId or stampIdentifier or qrUrl is required',
    (value) => Boolean(value?.verificationId || value?.stampIdentifier || value?.qrUrl),
  );

