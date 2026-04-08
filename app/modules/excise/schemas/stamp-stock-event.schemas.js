import { yup } from '../../../shared/middleware/validate.middleware.js';
import {
  STAMP_RETURN_REASON,
  STAMP_STOCK_EVENT_STATUS,
  STAMP_STOCK_EVENT_TYPE,
  STAMP_TRANSFER_REASON,
  STAMP_WASTAGE_REASON,
} from '../constants/excise.enums.js';

export const stockEventBodySchema = yup.object({
  eventType: yup.string().oneOf(Object.values(STAMP_STOCK_EVENT_TYPE)).required(),
  relatedStampRequestId: yup.string().uuid().nullable(),
  sourceFacilityId: yup.string().uuid().required(),
  targetFacilityId: yup.string().uuid().nullable(),
  reasonCode: yup
    .string()
    .oneOf([
      ...Object.values(STAMP_RETURN_REASON),
      ...Object.values(STAMP_WASTAGE_REASON),
      ...Object.values(STAMP_TRANSFER_REASON),
    ])
    .required(),
  quantity: yup.number().integer().positive().required(),
  notes: yup.string().trim().max(5000).nullable(),
  evidenceUrl: yup.string().trim().max(500).nullable(),
  meta: yup.object().nullable(),
});

export const stockEventReviewSchema = yup.object({
  decision: yup
    .string()
    .oneOf([STAMP_STOCK_EVENT_STATUS.APPROVED, STAMP_STOCK_EVENT_STATUS.REJECTED])
    .required(),
  rejectionReason: yup.string().trim().max(5000).nullable(),
});

