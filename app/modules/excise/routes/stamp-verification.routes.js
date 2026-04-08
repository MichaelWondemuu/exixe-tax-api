import express from 'express';
import {
  validateBody,
  validateParams,
} from '../../../shared/middleware/validate.middleware.js';
import { idParamsSchema } from '../schemas/common.schemas.js';
import { stampVerificationBodySchema } from '../schemas/stamp-verification.schemas.js';
import { authMiddleware } from '../../auth/middleware/auth.middleware.js';
import { requireSystemUser } from '../../auth/middleware/index.js';

export const buildStampVerificationRouter = ({
  stampVerificationController,
}) => {
  const router = express.Router();
  const adminRouter = express.Router();
  const publicRouter = express.Router();
  router.use(authMiddleware());
  adminRouter.use(requireSystemUser());

  publicRouter.post(
    '/public/stamp-verifications',
    validateBody(stampVerificationBodySchema),
    stampVerificationController.createPublic,
  );

  router.get('/stamp-verifications', stampVerificationController.list);
  router.get(
    '/stamp-verifications/:id',
    validateParams(idParamsSchema),
    stampVerificationController.getById,
  );
  router.post(
    '/stamp-verifications',
    validateBody(stampVerificationBodySchema),
    stampVerificationController.createOperator,
  );

  adminRouter.get('/stamp-verifications', stampVerificationController.list);
  adminRouter.get(
    '/stamp-verifications/summary',
    stampVerificationController.getSummary,
  );
  adminRouter.get(
    '/stamp-verifications/:id',
    validateParams(idParamsSchema),
    stampVerificationController.getById,
  );

  return { router, adminRouter, publicRouter };
};

