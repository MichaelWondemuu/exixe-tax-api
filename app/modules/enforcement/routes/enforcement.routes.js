import express from 'express';
import {
  validateBody,
  validateParams,
  validateQuery,
} from '../../../shared/middleware/validate.middleware.js';
import { authMiddleware } from '../../auth/middleware/auth.middleware.js';
import { requireSystemUser } from '../../auth/middleware/index.js';
import {
  counterfeitCaseCreateBodySchema,
  counterfeitCasePatchBodySchema,
  counterfeitReportBodySchema,
  counterfeitReportStatusPatchSchema,
  idParamsSchema,
} from '../schemas/counterfeit.schemas.js';
import {
  suspiciousProductReportBodySchema,
  suspiciousProductReportStatusPatchSchema,
} from '../schemas/suspicious-product.schemas.js';
import {
  productRecallCreateBodySchema,
  productRecallPatchBodySchema,
  recallsActiveQuerySchema,
} from '../schemas/recall.schemas.js';

/**
 * @param {{
 *   counterfeitController: import('../controllers/counterfeit.controller.js').CounterfeitController;
 *   suspiciousProductReportController: import('../controllers/suspicious-product-report.controller.js').SuspiciousProductReportController;
 *   productRecallController: import('../controllers/product-recall.controller.js').ProductRecallController;
 * }} deps
 */
export const buildEnforcementRouter = ({
  counterfeitController,
  suspiciousProductReportController,
  productRecallController,
}) => {
  const router = express.Router();
  const adminRouter = express.Router();

  router.use(authMiddleware());

  router.post(
    '/counterfeit-reports',
    validateBody(counterfeitReportBodySchema),
    counterfeitController.createReport,
  );
  router.post(
    '/suspicious-product-reports',
    validateBody(suspiciousProductReportBodySchema),
    suspiciousProductReportController.createReport,
  );
  router.post(
    '/counterfeit-cases',
    validateBody(counterfeitCaseCreateBodySchema),
    counterfeitController.createCase,
  );
  router.get('/counterfeit-cases', counterfeitController.listCases);
  router.get(
    '/counterfeit-cases/:id',
    validateParams(idParamsSchema),
    counterfeitController.getCaseById,
  );
  router.patch(
    '/counterfeit-cases/:id',
    validateParams(idParamsSchema),
    validateBody(counterfeitCasePatchBodySchema),
    counterfeitController.patchCase,
  );

  router.get(
    '/recalls/active',
    validateQuery(recallsActiveQuerySchema),
    productRecallController.listActiveRecalls,
  );

  adminRouter.use(requireSystemUser());
  adminRouter.get('/counterfeit-reports', counterfeitController.listReportsAdmin);
  adminRouter.get(
    '/counterfeit-reports/:id',
    validateParams(idParamsSchema),
    counterfeitController.getReportByIdAdmin,
  );
  adminRouter.patch(
    '/counterfeit-reports/:id/status',
    validateParams(idParamsSchema),
    validateBody(counterfeitReportStatusPatchSchema),
    counterfeitController.patchReportStatusAdmin,
  );
  adminRouter.get(
    '/suspicious-product-reports',
    suspiciousProductReportController.listReportsAdmin,
  );
  adminRouter.get(
    '/suspicious-product-reports/:id',
    validateParams(idParamsSchema),
    suspiciousProductReportController.getReportByIdAdmin,
  );
  adminRouter.patch(
    '/suspicious-product-reports/:id/status',
    validateParams(idParamsSchema),
    validateBody(suspiciousProductReportStatusPatchSchema),
    suspiciousProductReportController.patchReportStatusAdmin,
  );

  adminRouter.post(
    '/recalls',
    validateBody(productRecallCreateBodySchema),
    productRecallController.createRecall,
  );
  adminRouter.get('/recalls', productRecallController.listRecallsAdmin);
  adminRouter.get(
    '/recalls/:id',
    validateParams(idParamsSchema),
    productRecallController.getRecallByIdAdmin,
  );
  adminRouter.patch(
    '/recalls/:id',
    validateParams(idParamsSchema),
    validateBody(productRecallPatchBodySchema),
    productRecallController.patchRecall,
  );
  adminRouter.post(
    '/recalls/:id/publish',
    validateParams(idParamsSchema),
    productRecallController.publishRecall,
  );
  adminRouter.post(
    '/recalls/:id/suspend',
    validateParams(idParamsSchema),
    productRecallController.suspendRecall,
  );
  adminRouter.post(
    '/recalls/:id/close',
    validateParams(idParamsSchema),
    productRecallController.closeRecall,
  );

  router.use('/admin', adminRouter);

  return router;
};
