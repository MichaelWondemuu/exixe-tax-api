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
  stampLabelIdParamsSchema,
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
    '/:id',
    validateParams(stampLabelIdParamsSchema),
    stampLabelController.getById,
  );
  router.get(
    '/:id/audit',
    validateParams(stampLabelIdParamsSchema),
    stampLabelController.getAuditTrail,
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

  adminRouter.post(
    '/:id/enforce',
    validateParams(stampLabelIdParamsSchema),
    validateBody(enforceStampLabelBodySchema),
    stampLabelController.enforce,
  );

  return {
    router,
    adminRouter,
    publicRouter,
  };
};
