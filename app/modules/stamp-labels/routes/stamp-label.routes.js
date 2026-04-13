import express from 'express';
import { authMiddleware } from '../../auth/middleware/auth.middleware.js';
import { requireSystemUser } from '../../auth/middleware/index.js';
import {
  validateBody,
  validateParams,
} from '../../../shared/middleware/validate.middleware.js';
import {
  activateStampLabelBodySchema,
  applyStampLabelBodySchema,
  assignStampLabelBodySchema,
  auditStampLabelBodySchema,
  enforceStampLabelBodySchema,
  generateStampLabelsBodySchema,
  issueStampLabelBodySchema,
  publicVerifyStampLabelBodySchema,
  printStampLabelBatchBodySchema,
  stampLabelBatchCreateBodySchema,
  stampLabelBatchIdParamsSchema,
  stampLabelBatchParamsSchema,
  stampLabelBatchUpdateBodySchema,
  stampLabelIdParamsSchema,
  stampRequestIdParamsSchema,
  stampLabelUidParamsSchema,
  trackStampLabelBodySchema,
  verifyStampLabelBodySchema,
} from '../schemas/stamp-label.schemas.js';

export const buildStampLabelRouter = ({ stampLabelController }) => {
  const router = express.Router();
  const adminRouter = express.Router();
  const publicRouter = express.Router();
  router.use(authMiddleware());
  adminRouter.use(requireSystemUser());

  publicRouter.post(
    '/public/verify',
    validateBody(publicVerifyStampLabelBodySchema),
    stampLabelController.verifyPublic,
  );

  router.get('/', stampLabelController.list);
  router.get('/summary', stampLabelController.getSummary);
  router.get(
    '/by-uid/:stampUid',
    validateParams(stampLabelUidParamsSchema),
    stampLabelController.getByUid,
  );
  router.get(
    '/batch/:batchNumber',
    validateParams(stampLabelBatchParamsSchema),
    stampLabelController.getByBatchNumber,
  );
  router.get(
    '/batches/:batchNumber',
    validateParams(stampLabelBatchParamsSchema),
    stampLabelController.getBatchByNumberEntity,
  );
  router.get(
    '/request/:stampRequestId/batches',
    validateParams(stampRequestIdParamsSchema),
    stampLabelController.getBatchesByStampRequestId,
  );
  router.get(
    '/request/:stampRequestId/batches/audit',
    validateParams(stampRequestIdParamsSchema),
    stampLabelController.getBatchesAuditByStampRequestId,
  );
  router.get(
    '/:id',
    validateParams(stampLabelIdParamsSchema),
    stampLabelController.getById,
  );
  router.get(
    '/:id/audit',
    validateParams(stampLabelIdParamsSchema),
    stampLabelController.getAuditTrail,
  );
  router.get(
    '/batch/:batchNumber/audit',
    validateParams(stampLabelBatchParamsSchema),
    stampLabelController.getBatchAuditTrail,
  );

  adminRouter.post(
    '/generate',
    validateBody(generateStampLabelsBodySchema),
    stampLabelController.generate,
  );
  router.post(
    '/:id/issue',
    validateParams(stampLabelIdParamsSchema),
    validateBody(issueStampLabelBodySchema),
    stampLabelController.issue,
  );
  router.post(
    '/batch/:batchNumber/issue',
    validateParams(stampLabelBatchParamsSchema),
    validateBody(issueStampLabelBodySchema),
    stampLabelController.issueByBatch,
  );
  router.post(
    '/batch/:batchNumber/print',
    validateParams(stampLabelBatchParamsSchema),
    validateBody(printStampLabelBatchBodySchema),
    stampLabelController.printByBatch,
  );
  router.post(
    '/:id/assign',
    validateParams(stampLabelIdParamsSchema),
    validateBody(assignStampLabelBodySchema),
    stampLabelController.assign,
  );
  router.post(
    '/:id/apply',
    validateParams(stampLabelIdParamsSchema),
    validateBody(applyStampLabelBodySchema),
    stampLabelController.apply,
  );
  router.post(
    '/:id/activate',
    validateParams(stampLabelIdParamsSchema),
    validateBody(activateStampLabelBodySchema),
    stampLabelController.activate,
  );
  router.post(
    '/:id/track',
    validateParams(stampLabelIdParamsSchema),
    validateBody(trackStampLabelBodySchema),
    stampLabelController.track,
  );
  router.post(
    '/:id/verify',
    validateParams(stampLabelIdParamsSchema),
    validateBody(verifyStampLabelBodySchema),
    stampLabelController.verify,
  );
  router.post(
    '/:id/audit',
    validateParams(stampLabelIdParamsSchema),
    validateBody(auditStampLabelBodySchema),
    stampLabelController.audit,
  );
  router.post(
    '/batch/:batchNumber/audit',
    validateParams(stampLabelBatchParamsSchema),
    validateBody(auditStampLabelBodySchema),
    stampLabelController.auditByBatch,
  );

  adminRouter.post(
    '/:id/enforce',
    validateParams(stampLabelIdParamsSchema),
    validateBody(enforceStampLabelBodySchema),
    stampLabelController.enforce,
  );
  adminRouter.post(
    '/batch/:batchNumber/enforce',
    validateParams(stampLabelBatchParamsSchema),
    validateBody(enforceStampLabelBodySchema),
    stampLabelController.enforceByBatch,
  );
  adminRouter.get('/batches', stampLabelController.listBatches);
  adminRouter.get(
    '/batches/:id',
    validateParams(stampLabelBatchIdParamsSchema),
    stampLabelController.getBatchById,
  );
  adminRouter.post(
    '/batches',
    validateBody(stampLabelBatchCreateBodySchema),
    stampLabelController.createBatch,
  );
  adminRouter.patch(
    '/batches/:id',
    validateParams(stampLabelBatchIdParamsSchema),
    validateBody(stampLabelBatchUpdateBodySchema),
    stampLabelController.updateBatch,
  );
  adminRouter.delete(
    '/batches/:id',
    validateParams(stampLabelBatchIdParamsSchema),
    stampLabelController.deleteBatch,
  );

  return {
    router,
    adminRouter,
    publicRouter,
  };
};
