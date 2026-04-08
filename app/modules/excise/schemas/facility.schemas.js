import { yup } from '../../../shared/middleware/validate.middleware.js';
import { FACILITY_TYPES } from '../constants/excise.enums.js';

export const facilityBodySchema = yup.object({
  name: yup.string().trim().min(2).max(255).required(),
  facilityType: yup.string().oneOf(Object.values(FACILITY_TYPES)).required(),
  licenseNumber: yup.string().trim().max(128).nullable(),
  region: yup.string().trim().max(128).nullable(),
  zone: yup.string().trim().max(128).nullable(),
  woreda: yup.string().trim().max(128).nullable(),
  city: yup.string().trim().max(128).nullable(),
  addressLine1: yup.string().trim().min(2).max(255).required(),
  addressLine2: yup.string().trim().max(255).nullable(),
  isActive: yup.boolean().default(true),
});

export const facilityPatchSchema = yup.object({
  name: yup.string().trim().min(2).max(255),
  facilityType: yup.string().oneOf(Object.values(FACILITY_TYPES)),
  licenseNumber: yup.string().trim().max(128).nullable(),
  region: yup.string().trim().max(128).nullable(),
  zone: yup.string().trim().max(128).nullable(),
  woreda: yup.string().trim().max(128).nullable(),
  city: yup.string().trim().max(128).nullable(),
  addressLine1: yup.string().trim().min(2).max(255),
  addressLine2: yup.string().trim().max(255).nullable(),
  isActive: yup.boolean(),
});

