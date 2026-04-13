import { yup } from '../../../shared/middleware/validate.middleware.js';
import {
  STAMP_LABEL_BATCH_STATUS,
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

export const stampLabelBatchIdParamsSchema = yup.object({
  id: yup.string().uuid().required(),
});

export const stampRequestIdParamsSchema = yup.object({
  stampRequestId: yup.string().uuid().required(),
});

export const generateStampLabelsBodySchema = yup.object({
  count: yup.number().integer().min(1).max(5000).default(1),
  stampRequestId: yup.string().uuid().required(),
  templateId: yup.string().uuid().nullable(),
  templateCode: yup.string().trim().max(128).nullable(),
  templateVersion: yup.string().trim().max(32).nullable(),
  uidPrefix: yup.string().trim().max(32).nullable(),
  codeFormat: yup
    .string()
    .oneOf(Object.values(STAMP_LABEL_CODE_FORMAT))
    .nullable(),
  operatorType: yup
    .string()
    .oneOf(Object.values(STAMP_LABEL_OPERATOR_TYPE))
    .nullable(),
  operatorName: yup.string().trim().min(2).max(255).nullable(),
  operatorTin: yup.string().trim().min(5).max(64).nullable(),
  operatorLicenseNumber: yup.string().trim().max(128).nullable(),
  merchantId: yup.string().trim().max(128).nullable(),
  merchantName: yup.string().trim().max(255).nullable(),
  ethiopiaRevenueOffice: yup.string().trim().max(255).nullable(),
  productId: yup.string().uuid().nullable(),
  productName: yup.string().trim().max(255).nullable(),
  packageLevel: yup
    .string()
    .oneOf(Object.values(STAMP_LABEL_PACKAGE_LEVEL))
    .nullable(),
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

export const printStampLabelBatchBodySchema = yup.object({
  printedAt: yup.date().nullable(),
  printedCount: yup.number().integer().min(0).nullable(),
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
    .nullable(),
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
    .nullable(),
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

export const stampLabelBatchCreateBodySchema = yup.object({
  batchNumber: yup.string().trim().max(128).nullable(),
  organizationId: yup.string().uuid().nullable(),
  status: yup
    .string()
    .oneOf(Object.values(STAMP_LABEL_BATCH_STATUS))
    .default(STAMP_LABEL_BATCH_STATUS.GENERATED),
  totalCount: yup.number().integer().min(0).default(0),
  generatedCount: yup.number().integer().min(0).default(0),
  issuedCount: yup.number().integer().min(0).default(0),
  printedCount: yup.number().integer().min(0).default(0),
  printedAt: yup.date().nullable(),
  notes: yup.string().trim().max(5000).nullable(),
  metadata: yup.object().nullable(),
});

export const stampLabelBatchUpdateBodySchema = yup.object({
  status: yup.string().oneOf(Object.values(STAMP_LABEL_BATCH_STATUS)).nullable(),
  printedCount: yup.number().integer().min(0).nullable(),
  printedAt: yup.date().nullable(),
  notes: yup.string().trim().max(5000).nullable(),
  metadata: yup.object().nullable(),
});

