import { yup } from '../../../shared/middleware/validate.middleware.js';
import {
  COUNTERFEIT_CASE_STATUS,
  COUNTERFEIT_REPORT_STATUS,
} from '../constants/enforcement.enums.js';

export const idParamsSchema = yup.object({
  id: yup.string().uuid().required(),
});

export const counterfeitReportBodySchema = yup.object({
  description: yup.string().trim().min(1).max(20000).required(),
  subjectOrganizationId: yup.string().uuid().nullable(),
  reporterName: yup.string().trim().max(255).nullable(),
  reporterEmail: yup.string().trim().email().max(255).nullable(),
  reporterPhone: yup.string().trim().max(64).nullable(),
  facilityId: yup.string().uuid().nullable(),
  productId: yup.string().uuid().nullable(),
  stampIdentifier: yup.string().trim().max(256).nullable(),
  evidence: yup.object().nullable(),
});

export const counterfeitCaseCreateBodySchema = yup.object({
  title: yup.string().trim().min(1).max(500).required(),
  description: yup.string().trim().max(20000).nullable(),
  subjectOrganizationId: yup.string().uuid().nullable(),
  sourceCounterfeitReportId: yup.string().uuid().nullable(),
  stampVerificationIds: yup
    .array()
    .of(yup.string().uuid().required())
    .max(100)
    .default([]),
});

export const counterfeitCasePatchBodySchema = yup
  .object({
    title: yup.string().trim().min(1).max(500).nullable(),
    description: yup.string().trim().max(20000).nullable(),
    status: yup
      .string()
      .oneOf(Object.values(COUNTERFEIT_CASE_STATUS))
      .nullable(),
    assignedToUserId: yup.string().uuid().nullable(),
    subjectOrganizationId: yup.string().uuid().nullable(),
  })
  .test(
    'non-empty-patch',
    'At least one field is required',
    (value) => value != null && Object.keys(value).length > 0,
  );

export const counterfeitReportStatusPatchSchema = yup.object({
  status: yup
    .string()
    .oneOf(Object.values(COUNTERFEIT_REPORT_STATUS))
    .required(),
});
