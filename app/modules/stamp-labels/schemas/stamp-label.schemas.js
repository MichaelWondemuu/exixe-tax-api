import { yup } from '../../../shared/middleware/validate.middleware.js';
import {
  STAMP_LABEL_CODE_FORMAT,
  STAMP_LABEL_ENFORCEMENT_ACTION,
  STAMP_LABEL_OPERATOR_TYPE,
  STAMP_LABEL_PACKAGE_LEVEL,
  STAMP_LABEL_VERIFICATION_CHANNEL,
  STAMP_LABEL_VERIFICATION_RESULT,
} from '../constants/stamp-labels.enums.js';

export const stampLabelIdParamsSchema = yup.object({
  id: yup.string().uuid().required(),
});

export const stampLabelUidParamsSchema = yup.object({
  stampUid: yup.string().trim().min(1).max(128).required(),
});

export const stampLabelBatchParamsSchema = yup.object({
  batchNumber: yup.string().trim().min(1).max(128).required(),
});

export const generateStampLabelsBodySchema = yup.object({
  count: yup.number().integer().min(1).max(5000).default(1),
  stampRequestId: yup.string().uuid().required(),
  uidPrefix: yup.string().trim().max(32).nullable(),
  digitalLinkBase: yup.string().trim().url().nullable(),
  codeFormat: yup
    .string()
    .oneOf(Object.values(STAMP_LABEL_CODE_FORMAT))
    .required(),
  operatorType: yup
    .string()
    .oneOf(Object.values(STAMP_LABEL_OPERATOR_TYPE))
    .required(),
  operatorName: yup.string().trim().min(2).max(255).required(),
  operatorTin: yup.string().trim().min(5).max(64).required(),
  operatorLicenseNumber: yup.string().trim().max(128).nullable(),
  ethiopiaRevenueOffice: yup.string().trim().max(255).nullable(),
  productId: yup.string().uuid().nullable(),
  productName: yup.string().trim().max(255).nullable(),
  packageLevel: yup
    .string()
    .oneOf(Object.values(STAMP_LABEL_PACKAGE_LEVEL))
    .required(),
  batchNumber: yup.string().trim().max(128).nullable(),
  productionDate: yup.date().nullable(),
  forecastReference: yup.string().trim().max(128).nullable(),
  forecastSubmittedAt: yup.date().nullable(),
  requiresSixtyDayForecast: yup.boolean().default(true),
  isImported: yup.boolean().default(false),
  customsDeclarationNumber: yup.string().trim().max(128).nullable(),
  metadata: yup.object().nullable(),
});

export const issueStampLabelBodySchema = yup.object({
  issuedAt: yup.date().nullable(),
  notes: yup.string().trim().max(5000).nullable(),
});

export const assignStampLabelBodySchema = yup.object({
  assignedAt: yup.date().nullable(),
  assignedToOperatorId: yup.string().trim().max(128).required(),
});

export const applyStampLabelBodySchema = yup.object({
  appliedAt: yup.date().nullable(),
  applicationLineCode: yup.string().trim().max(128).required(),
  locationCode: yup.string().trim().max(128).nullable(),
});

export const activateStampLabelBodySchema = yup.object({
  activatedAt: yup.date().nullable(),
  activationLocationCode: yup.string().trim().max(128).required(),
});

export const trackStampLabelBodySchema = yup.object({
  trackedAt: yup.date().nullable(),
  locationCode: yup.string().trim().max(128).required(),
  checkpoint: yup.string().trim().max(255).nullable(),
  scanDeviceId: yup.string().trim().max(128).nullable(),
});

export const verifyStampLabelBodySchema = yup.object({
  stampUid: yup.string().trim().max(128).nullable(),
  verifiedAt: yup.date().nullable(),
  channel: yup
    .string()
    .oneOf(Object.values(STAMP_LABEL_VERIFICATION_CHANNEL))
    .required(),
  result: yup
    .string()
    .oneOf(Object.values(STAMP_LABEL_VERIFICATION_RESULT))
    .required(),
  locationCode: yup.string().trim().max(128).nullable(),
  inspectorBadge: yup.string().trim().max(128).nullable(),
  remarks: yup.string().trim().max(5000).nullable(),
});

export const publicVerifyStampLabelBodySchema = yup.object({
  stampUid: yup.string().trim().min(6).max(128).required(),
  verifiedAt: yup.date().nullable(),
  channel: yup
    .string()
    .oneOf(Object.values(STAMP_LABEL_VERIFICATION_CHANNEL))
    .required(),
  result: yup
    .string()
    .oneOf(Object.values(STAMP_LABEL_VERIFICATION_RESULT))
    .required(),
  locationCode: yup.string().trim().max(128).nullable(),
  remarks: yup.string().trim().max(5000).nullable(),
});

export const auditStampLabelBodySchema = yup.object({
  auditedAt: yup.date().nullable(),
  inspectionReference: yup.string().trim().max(128).nullable(),
  findings: yup.mixed().nullable(),
  notes: yup.string().trim().max(5000).nullable(),
});

export const enforceStampLabelBodySchema = yup.object({
  action: yup
    .string()
    .oneOf(Object.values(STAMP_LABEL_ENFORCEMENT_ACTION))
    .required(),
  enforcedAt: yup.date().nullable(),
  caseNumber: yup.string().trim().max(128).nullable(),
  notes: yup.string().trim().max(5000).nullable(),
});
