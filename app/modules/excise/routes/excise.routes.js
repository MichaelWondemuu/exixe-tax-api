import express from 'express';
import { authMiddleware, requireSystemUser } from '../../auth/middleware/index.js';
import { buildFacilityRouter } from './facility.routes.js';
import { buildDeliveryNoteRouter } from './delivery-note.routes.js';
import { buildStampRequestRouter } from './stamp-request.routes.js';
import { buildForecastRouter } from './forecast.routes.js';
import { buildStampStockEventRouter } from './stamp-stock-event.routes.js';
import { buildStampVerificationRouter } from './stamp-verification.routes.js';
import { buildExciseConfigRouter } from './config.routes.js';

/**
 * @param {{
 *  facilityController: import('../controllers/facility.controller.js').FacilityController;
 *  deliveryNoteController: import('../controllers/delivery-note.controller.js').DeliveryNoteController;
 *  stampRequestController: import('../controllers/stamp-request.controller.js').StampRequestController;
 *  forecastController: import('../controllers/forecast.controller.js').ForecastController;
 *  stampStockEventController: import('../controllers/stamp-stock-event.controller.js').StampStockEventController;
 *  stampVerificationController: import('../controllers/stamp-verification.controller.js').StampVerificationController;
 *  exciseConfigController: import('../controllers/config.controller.js').ExciseConfigController;
 * }} deps
 */
export const buildExciseRouter = (deps) => {
  const router = express.Router();
  const {
    facilityController,
    deliveryNoteController,
    stampRequestController,
    forecastController,
    stampStockEventController,
    stampVerificationController,
    exciseConfigController,
  } = deps;

  const { publicRouter, router: stampVerificationRouter, adminRouter: stampVerificationAdminRouter } =
    buildStampVerificationRouter({ stampVerificationController });
  const { router: stampRequestRouter, adminRouter: stampRequestAdminRouter } =
    buildStampRequestRouter({ stampRequestController });
  const { router: forecastRouter, adminRouter: forecastAdminRouter } =
    buildForecastRouter({ forecastController });
  const { router: stockEventRouter, adminRouter: stockEventAdminRouter } =
    buildStampStockEventRouter({ stampStockEventController });
  const { adminRouter: configAdminRouter } = buildExciseConfigRouter({
    exciseConfigController,
  });

  router.use('/', publicRouter);

  router.use(authMiddleware());
  router.use('/', buildFacilityRouter({ facilityController }));
  router.use('/', buildDeliveryNoteRouter({ deliveryNoteController }));
  router.use('/', stampRequestRouter);
  router.use('/', forecastRouter);
  router.use('/', stockEventRouter);
  router.use('/', stampVerificationRouter);

  const adminRouter = express.Router();
  adminRouter.use(requireSystemUser());
  adminRouter.use('/', stampRequestAdminRouter);
  adminRouter.use('/', forecastAdminRouter);
  adminRouter.use('/', stockEventAdminRouter);
  adminRouter.use('/', stampVerificationAdminRouter);
  adminRouter.use('/', configAdminRouter);
  router.use('/admin', adminRouter);

  return router;
};
