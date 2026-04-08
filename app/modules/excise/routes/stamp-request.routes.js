import express from 'express';
import {
  validateBody,
  validateParams,
} from '../../../shared/middleware/validate.middleware.js';
import { idParamsSchema } from '../schemas/common.schemas.js';
import {
  stampRequestBodySchema,
  stampRequestPaymentSchema,
  stampRequestReviewSchema,
} from '../schemas/stamp-request.schemas.js';

export const buildStampRequestRouter = ({ stampRequestController }) => {
  const router = express.Router();
  const adminRouter = express.Router();

  router.get('/stamp-requests', stampRequestController.list);
  router.get(
    '/stamp-requests/:id',
    validateParams(idParamsSchema),
    stampRequestController.getById,
  );
  router.post(
    '/stamp-requests',
    validateBody(stampRequestBodySchema),
    stampRequestController.create,
  );
  router.patch(
    '/stamp-requests/:id/payment',
    validateParams(idParamsSchema),
    validateBody(stampRequestPaymentSchema),
    stampRequestController.updatePayment,
  );
  router.post(
    '/stamp-requests/:id/submit',
    validateParams(idParamsSchema),
    stampRequestController.submit,
  );
  router.post(
    '/stamp-requests/:id/fulfill',
    validateParams(idParamsSchema),
    stampRequestController.fulfill,
  );

  adminRouter.get('/stamp-requests/sla-breaches', stampRequestController.listSlaBreaches);
  adminRouter.patch(
    '/stamp-requests/:id/review',
    validateParams(idParamsSchema),
    validateBody(stampRequestReviewSchema),
    stampRequestController.review,
  );

  return { router, adminRouter };
};

