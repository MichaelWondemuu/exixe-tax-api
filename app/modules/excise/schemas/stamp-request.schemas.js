import { yup } from '../../../shared/middleware/validate.middleware.js';
import { STAMP_REQUEST_STATUS } from '../constants/excise.enums.js';

export const stampRequestBodySchema = yup.object({
  facilityId: yup.string().uuid().required(),
  goodsCategory: yup.string().trim().min(1).max(128).required(),
  goodsDescription: yup.string().trim().min(1).max(255).required(),
  quantity: yup.number().integer().positive().required(),
  requiredByDate: yup.date().required(),
  plannedProductionOrImportDate: yup.date().nullable(),
  attachmentUrl: yup.string().trim().max(500).nullable(),
});

export const stampRequestPaymentSchema = yup.object({
  stampFeeAmount: yup.number().min(0).required(),
  stampFeeCurrency: yup.string().trim().max(8).default('ETB'),
  paymentReference: yup.string().trim().max(128).required(),
  paymentProofUrl: yup.string().trim().max(500).required(),
  paidAt: yup.date().nullable(),
});

export const stampRequestReviewSchema = yup.object({
  decision: yup
    .string()
    .oneOf([STAMP_REQUEST_STATUS.APPROVED, STAMP_REQUEST_STATUS.REJECTED])
    .required(),
  rejectionReason: yup.string().trim().max(5000).nullable(),
});

