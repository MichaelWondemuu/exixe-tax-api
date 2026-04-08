import express from 'express';
import {
  validateBody,
  validateParams,
} from '../../../shared/middleware/validate.middleware.js';
import { idParamsSchema } from '../schemas/common.schemas.js';
import {
  stockEventBodySchema,
  stockEventReviewSchema,
} from '../schemas/stamp-stock-event.schemas.js';

export const buildStampStockEventRouter = ({ stampStockEventController }) => {
  const router = express.Router();
  const adminRouter = express.Router();

  router.get('/stamp-stock-events', stampStockEventController.list);
  router.get(
    '/stamp-stock-events/:id',
    validateParams(idParamsSchema),
    stampStockEventController.getById,
  );
  router.post(
    '/stamp-stock-events',
    validateBody(stockEventBodySchema),
    stampStockEventController.create,
  );
  router.post(
    '/stamp-stock-events/:id/submit',
    validateParams(idParamsSchema),
    stampStockEventController.submit,
  );
  router.post(
    '/stamp-stock-events/:id/complete',
    validateParams(idParamsSchema),
    stampStockEventController.complete,
  );

  adminRouter.patch(
    '/stamp-stock-events/:id/review',
    validateParams(idParamsSchema),
    validateBody(stockEventReviewSchema),
    stampStockEventController.review,
  );

  return { router, adminRouter };
};

