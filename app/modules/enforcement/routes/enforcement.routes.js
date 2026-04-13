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
import {
  productionRecordBodySchema,
  productionRecordPatchSchema,
} from '../schemas/production-record.schemas.js';
import {
  stockSnapshotBodySchema,
  stockSnapshotPatchSchema,
} from '../schemas/stock-snapshot.schemas.js';
import {
  reconciliationRunCreateBodySchema,
  reconciliationRunItemsQuerySchema,
} from '../schemas/reconciliation.schemas.js';

/**
 * @param {{
 *   counterfeitController: import('../controllers/counterfeit.controller.js').CounterfeitController;
 *   suspiciousProductReportController: import('../controllers/suspicious-product-report.controller.js').SuspiciousProductReportController;
 *   productRecallController: import('../controllers/product-recall.controller.js').ProductRecallController;
 *   productionRecordController: import('../controllers/production-record.controller.js').ProductionRecordController;
 *   stockSnapshotController: import('../controllers/stock-snapshot.controller.js').StockSnapshotController;
 *   reconciliationController: import('../controllers/reconciliation.controller.js').ReconciliationController;
 * }} deps
 */
export const buildEnforcementRouter = ({
  counterfeitController,
  suspiciousProductReportController,
  productRecallController,
  productionRecordController,
  stockSnapshotController,
  reconciliationController,
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
  router.post(
    '/production-records',
    validateBody(productionRecordBodySchema),
    productionRecordController.createRecord,
  );
  router.get('/production-records', productionRecordController.listRecords);
  router.get(
    '/production-records/:id',
    validateParams(idParamsSchema),
    productionRecordController.getRecordById,
  );
  router.patch(
    '/production-records/:id',
    validateParams(idParamsSchema),
    validateBody(productionRecordPatchSchema),
    productionRecordController.patchRecord,
  );
  router.post(
    '/stock-snapshots',
    validateBody(stockSnapshotBodySchema),
    stockSnapshotController.createSnapshot,
  );
  router.get('/stock-snapshots', stockSnapshotController.listSnapshots);
  router.get(
    '/stock-snapshots/:id',
    validateParams(idParamsSchema),
    stockSnapshotController.getSnapshotById,
  );
  router.patch(
    '/stock-snapshots/:id',
    validateParams(idParamsSchema),
    validateBody(stockSnapshotPatchSchema),
    stockSnapshotController.patchSnapshot,
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
  adminRouter.post(
    '/reconciliations/runs',
    validateBody(reconciliationRunCreateBodySchema),
    reconciliationController.createRun,
  );
  adminRouter.get('/reconciliations/runs', reconciliationController.listRuns);
  adminRouter.get(
    '/reconciliations/runs/:id',
    validateParams(idParamsSchema),
    reconciliationController.getRunById,
  );
  adminRouter.get(
    '/reconciliations/runs/:id/items',
    validateParams(idParamsSchema),
    validateQuery(reconciliationRunItemsQuerySchema),
    reconciliationController.listRunItems,
  );

  router.use('/admin', adminRouter);

  return router;
};
