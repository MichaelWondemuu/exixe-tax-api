import express from 'express';
import {
  authMiddleware,
  requireSystemUser,
} from '../../auth/middleware/index.js';
import {
  validateBody,
  validateParams,
  yup,
} from '../../../shared/middleware/validate.middleware.js';
import {
  DELIVERY_NOTE_STATUS,
  FACILITY_TYPES,
  STAMP_RETURN_REASON,
  STAMP_STOCK_EVENT_STATUS,
  STAMP_STOCK_EVENT_TYPE,
  STAMP_TRANSFER_REASON,
  STAMP_VERIFICATION_ACTOR_TYPE,
  STAMP_VERIFICATION_CHANNEL,
  STAMP_VERIFICATION_RESULT,
  STAMP_WASTAGE_REASON,
  STAMP_REQUEST_STATUS,
} from '../constants/excise.enums.js';

const idParamsSchema = yup.object({
  id: yup.string().uuid().required(),
});

const facilityBodySchema = yup.object({
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

const facilityPatchSchema = yup.object({
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

const deliveryNoteBodySchema = yup.object({
  fromFacilityId: yup.string().uuid().required(),
  toFacilityId: yup.string().uuid().required(),
  shipmentRoute: yup.string().trim().max(255).nullable(),
  transporterName: yup.string().trim().max(255).nullable(),
  vehiclePlateNo: yup.string().trim().max(64).nullable(),
  expectedDispatchAt: yup.date().required(),
  expectedArrivalAt: yup.date().nullable(),
  items: yup
    .array()
    .of(
      yup.object({
        productDescription: yup.string().trim().min(1).max(255).required(),
        quantity: yup.number().positive().required(),
        unit: yup.string().trim().min(1).max(32).required(),
      }),
    )
    .min(1)
    .required(),
  remarks: yup.string().trim().max(5000).nullable(),
});

const deliveryNoteStatusSchema = yup.object({
  status: yup.string().oneOf(Object.values(DELIVERY_NOTE_STATUS)).required(),
});

const stampRequestBodySchema = yup.object({
  facilityId: yup.string().uuid().required(),
  goodsCategory: yup.string().trim().min(1).max(128).required(),
  goodsDescription: yup.string().trim().min(1).max(255).required(),
  quantity: yup.number().integer().positive().required(),
  requiredByDate: yup.date().required(),
  plannedProductionOrImportDate: yup.date().nullable(),
  attachmentUrl: yup.string().trim().max(500).nullable(),
});

const stampRequestPaymentSchema = yup.object({
  stampFeeAmount: yup.number().min(0).required(),
  stampFeeCurrency: yup.string().trim().max(8).default('ETB'),
  paymentReference: yup.string().trim().max(128).required(),
  paymentProofUrl: yup.string().trim().max(500).required(),
  paidAt: yup.date().nullable(),
});

const stampRequestReviewSchema = yup.object({
  decision: yup
    .string()
    .oneOf([STAMP_REQUEST_STATUS.APPROVED, STAMP_REQUEST_STATUS.REJECTED])
    .required(),
  rejectionReason: yup.string().trim().max(5000).nullable(),
});

const forecastMonthItemSchema = yup.object({
  month: yup.string().matches(/^\d{4}-\d{2}$/).required(),
  quantity: yup.number().integer().min(0).required(),
});

const forecastBodySchema = yup.object({
  facilityId: yup.string().uuid().required(),
  goodsCategory: yup.string().trim().min(1).max(128).required(),
  monthlyPlan: yup.array().of(forecastMonthItemSchema).length(6).required(),
});

const forecastPatchSchema = yup.object({
  goodsCategory: yup.string().trim().min(1).max(128),
  monthlyPlan: yup.array().of(forecastMonthItemSchema).length(6),
});

const stockEventBodySchema = yup.object({
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

const stockEventReviewSchema = yup.object({
  decision: yup
    .string()
    .oneOf([STAMP_STOCK_EVENT_STATUS.APPROVED, STAMP_STOCK_EVENT_STATUS.REJECTED])
    .required(),
  rejectionReason: yup.string().trim().max(5000).nullable(),
});

const stampVerificationBodySchema = yup.object({
  actorType: yup.string().oneOf(Object.values(STAMP_VERIFICATION_ACTOR_TYPE)).required(),
  facilityId: yup.string().uuid().nullable(),
  channel: yup.string().oneOf(Object.values(STAMP_VERIFICATION_CHANNEL)).required(),
  result: yup.string().oneOf(Object.values(STAMP_VERIFICATION_RESULT)).required(),
  stampIdentifier: yup.string().trim().min(1).max(256).required(),
  productDescription: yup.string().trim().max(255).nullable(),
  supplierName: yup.string().trim().max(255).nullable(),
  supplierDocumentType: yup.string().trim().max(64).nullable(),
  supplierDocumentNumber: yup.string().trim().max(128).nullable(),
  verificationEvidence: yup.object().nullable(),
  remarks: yup.string().trim().max(5000).nullable(),
  verifiedAt: yup.date().nullable(),
});

/**
 * @param {{ exciseController: import('../controllers/excise.controller.js').ExciseController }} deps
 */
export const buildExciseRouter = ({ exciseController }) => {
  const router = express.Router();
  router.post(
    '/public/stamp-verifications',
    validateBody(stampVerificationBodySchema),
    exciseController.createPublicStampVerification,
  );

  router.use(authMiddleware());

  router.get('/facilities', exciseController.listFacilities);
  router.get(
    '/facilities/:id',
    validateParams(idParamsSchema),
    exciseController.getFacilityById,
  );
  router.post(
    '/facilities',
    validateBody(facilityBodySchema),
    exciseController.createFacility,
  );
  router.patch(
    '/facilities/:id',
    validateParams(idParamsSchema),
    validateBody(facilityPatchSchema),
    exciseController.updateFacility,
  );

  router.get('/delivery-notes', exciseController.listDeliveryNotes);
  router.get(
    '/delivery-notes/:id',
    validateParams(idParamsSchema),
    exciseController.getDeliveryNoteById,
  );
  router.post(
    '/delivery-notes',
    validateBody(deliveryNoteBodySchema),
    exciseController.createDeliveryNote,
  );
  router.patch(
    '/delivery-notes/:id/status',
    validateParams(idParamsSchema),
    validateBody(deliveryNoteStatusSchema),
    exciseController.updateDeliveryNoteStatus,
  );

  router.get('/stamp-requests', exciseController.listStampRequests);
  router.get(
    '/stamp-requests/:id',
    validateParams(idParamsSchema),
    exciseController.getStampRequestById,
  );
  router.post(
    '/stamp-requests',
    validateBody(stampRequestBodySchema),
    exciseController.createStampRequest,
  );
  router.patch(
    '/stamp-requests/:id/payment',
    validateParams(idParamsSchema),
    validateBody(stampRequestPaymentSchema),
    exciseController.updateStampRequestPayment,
  );
  router.post(
    '/stamp-requests/:id/submit',
    validateParams(idParamsSchema),
    exciseController.submitStampRequest,
  );
  router.post(
    '/stamp-requests/:id/fulfill',
    validateParams(idParamsSchema),
    exciseController.fulfillStampRequest,
  );

  router.get('/forecasts', exciseController.listForecasts);
  router.get(
    '/forecasts/:id',
    validateParams(idParamsSchema),
    exciseController.getForecastById,
  );
  router.post(
    '/forecasts',
    validateBody(forecastBodySchema),
    exciseController.createForecast,
  );
  router.patch(
    '/forecasts/:id',
    validateParams(idParamsSchema),
    validateBody(forecastPatchSchema),
    exciseController.updateForecast,
  );
  router.post(
    '/forecasts/:id/submit',
    validateParams(idParamsSchema),
    exciseController.submitForecast,
  );

  router.get('/stamp-stock-events', exciseController.listStockEvents);
  router.get(
    '/stamp-stock-events/:id',
    validateParams(idParamsSchema),
    exciseController.getStockEventById,
  );
  router.post(
    '/stamp-stock-events',
    validateBody(stockEventBodySchema),
    exciseController.createStockEvent,
  );
  router.post(
    '/stamp-stock-events/:id/submit',
    validateParams(idParamsSchema),
    exciseController.submitStockEvent,
  );
  router.post(
    '/stamp-stock-events/:id/complete',
    validateParams(idParamsSchema),
    exciseController.completeStockEvent,
  );
  router.get('/stamp-verifications', exciseController.listStampVerifications);
  router.get(
    '/stamp-verifications/:id',
    validateParams(idParamsSchema),
    exciseController.getStampVerificationById,
  );
  router.post(
    '/stamp-verifications',
    validateBody(stampVerificationBodySchema),
    exciseController.createStampVerification,
  );

  const adminRouter = express.Router();
  adminRouter.use(requireSystemUser());
  adminRouter.get(
    '/stamp-requests/sla-breaches',
    exciseController.listStampRequestSlaBreaches,
  );
  adminRouter.patch(
    '/stamp-requests/:id/review',
    validateParams(idParamsSchema),
    validateBody(stampRequestReviewSchema),
    exciseController.reviewStampRequest,
  );
  adminRouter.get('/forecasts', exciseController.listForecasts);
  adminRouter.get(
    '/forecasts/:id',
    validateParams(idParamsSchema),
    exciseController.getForecastById,
  );
  adminRouter.patch(
    '/stamp-stock-events/:id/review',
    validateParams(idParamsSchema),
    validateBody(stockEventReviewSchema),
    exciseController.reviewStockEvent,
  );
  adminRouter.get('/stamp-verifications', exciseController.listStampVerifications);
  adminRouter.get(
    '/stamp-verifications/summary',
    exciseController.getStampVerificationSummary,
  );
  adminRouter.get(
    '/stamp-verifications/:id',
    validateParams(idParamsSchema),
    exciseController.getStampVerificationById,
  );
  router.use('/admin', adminRouter);

  return router;
};
