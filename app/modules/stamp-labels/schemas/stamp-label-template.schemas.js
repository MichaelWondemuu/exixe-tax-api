import { yup } from '../../../shared/middleware/validate.middleware.js';
import {
  STAMP_LABEL_CODE_FORMAT,
  STAMP_LABEL_PACKAGE_LEVEL,
  STAMP_LABEL_SECURITY_FEATURE,
  STAMP_LABEL_TEMPLATE_LIFECYCLE_STATUS,
  STAMP_LABEL_TEMPLATE_RESOLVED_BY,
} from '../constants/stamp-labels.enums.js';

export const stampLabelTemplateIdParamsSchema = yup.object({
  id: yup.string().uuid().required(),
});

export const stampRequestIdParamsSchema = yup.object({
  stampRequestId: yup.string().uuid().required(),
});

export const stampLabelTemplateBodySchema = yup.object({
  code: yup.string().trim().min(2).max(128).required(),
  version: yup.string().trim().max(32).default('v1'),
  lifecycleStatus: yup
    .string()
    .oneOf(Object.values(STAMP_LABEL_TEMPLATE_LIFECYCLE_STATUS))
    .default(STAMP_LABEL_TEMPLATE_LIFECYCLE_STATUS.ACTIVE),
  resolvedBy: yup
    .string()
    .oneOf(Object.values(STAMP_LABEL_TEMPLATE_RESOLVED_BY))
    .default(STAMP_LABEL_TEMPLATE_RESOLVED_BY.PRODUCT),
  productId: yup.string().uuid().nullable(),
  variantId: yup.string().uuid().nullable(),
  categoryId: yup.string().uuid().nullable(),
  codeFormat: yup
    .string()
    .oneOf(Object.values(STAMP_LABEL_CODE_FORMAT))
    .default(STAMP_LABEL_CODE_FORMAT.QR),
  uidPrefix: yup.string().trim().max(64).nullable(),
  packageLevel: yup
    .string()
    .oneOf(Object.values(STAMP_LABEL_PACKAGE_LEVEL))
    .default(STAMP_LABEL_PACKAGE_LEVEL.UNIT),
  qrEnabled: yup.boolean().default(true),
  serialPattern: yup.string().trim().max(255).nullable(),
  labelStructure: yup.string().max(20000).nullable(),
  securityFeatures: yup
    .array()
    .of(yup.string().oneOf(Object.values(STAMP_LABEL_SECURITY_FEATURE)))
    .default([
      STAMP_LABEL_SECURITY_FEATURE.UNIQUE_IDENTIFIER,
      STAMP_LABEL_SECURITY_FEATURE.ANTI_DUPLICATION_GUARD,
    ]),
});

export const stampLabelTemplatePatchSchema = stampLabelTemplateBodySchema
  .shape({
    code: yup.string().trim().min(2).max(128),
  })
  .noUnknown(false);
