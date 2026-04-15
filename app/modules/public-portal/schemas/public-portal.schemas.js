import { yup } from '../../../shared/middleware/validate.middleware.js';

export const portalVerifyBodySchema = yup.object({
  stampUid: yup.string().trim().max(128).nullable(),
  code: yup.string().trim().max(128).nullable(),
  channel: yup.string().trim().max(32).nullable(),
  locationCode: yup.string().trim().max(128).nullable(),
  remarks: yup.string().trim().max(5000).nullable(),
});

export const portalCreateReportBodySchema = yup.object({
  reportType: yup
    .string()
    .oneOf(['SUSPICIOUS_STAMP', 'ILLEGAL_PRODUCT', 'COUNTERFEIT_ALERT'])
    .required(),
  stampUid: yup.string().trim().max(128).nullable(),
  channel: yup.string().trim().max(32).nullable(),
  productName: yup.string().trim().max(255).nullable(),
  address: yup.string().trim().max(255).nullable(),
  city: yup.string().trim().max(128).nullable(),
  region: yup.string().trim().max(128).nullable(),
  woreda: yup.string().trim().max(128).nullable(),
  latitude: yup.number().min(-90).max(90).nullable(),
  longitude: yup.number().min(-180).max(180).nullable(),
  location: yup.string().trim().max(255).nullable(),
  comments: yup.string().trim().max(5000).nullable(),
  photos: yup.array().of(yup.string().trim().max(1024)).nullable(),
  reporterName: yup.string().trim().max(255).nullable(),
  reporterContact: yup.string().trim().max(255).nullable(),
  reporterId: yup.string().trim().max(128).nullable(),
});

export const portalReportReferenceParamsSchema = yup.object({
  reference: yup.string().trim().min(6).max(64).required(),
});

export const portalProductIdParamsSchema = yup.object({
  productId: yup.string().uuid().required(),
});

export const portalAdminAnnouncementBodySchema = yup.object({
  code: yup.string().trim().max(64).nullable(),
  category: yup
    .string()
    .oneOf(['ALERT', 'REGULATORY_UPDATE', 'AWARENESS', 'CAMPAIGN'])
    .required(),
  priority: yup.string().oneOf(['HIGH', 'MEDIUM', 'LOW']).required(),
  title: yup.string().trim().max(255).required(),
  message: yup.string().trim().max(5000).required(),
  isActive: yup.boolean().nullable(),
});

export const portalAdminUpdateReportStatusBodySchema = yup.object({
  status: yup
    .string()
    .oneOf(['SUBMITTED', 'UNDER_REVIEW', 'ACTION_TAKEN', 'CLOSED'])
    .required(),
  note: yup.string().trim().max(1000).nullable(),
});

export const portalAdminNotificationBodySchema = yup.object({
  reporterId: yup.string().trim().max(128).nullable(),
  type: yup.string().trim().max(64).required(),
  title: yup.string().trim().max(255).required(),
  message: yup.string().trim().max(5000).required(),
  payload: yup.object().nullable(),
});
