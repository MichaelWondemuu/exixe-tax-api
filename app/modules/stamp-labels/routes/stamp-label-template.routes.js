import express from 'express';
import { authMiddleware } from '../../auth/middleware/auth.middleware.js';
import { requireSystemUser } from '../../auth/middleware/index.js';
import {
  validateBody,
  validateParams,
} from '../../../shared/middleware/validate.middleware.js';
import {
  stampLabelTemplateBodySchema,
  stampLabelTemplateIdParamsSchema,
  stampLabelTemplatePatchSchema,
  stampRequestIdParamsSchema,
} from '../schemas/stamp-label-template.schemas.js';

export const buildStampLabelTemplateRouter = ({ stampLabelTemplateController }) => {
  const router = express.Router();
  const adminRouter = express.Router();
  router.use(authMiddleware());
  adminRouter.use(requireSystemUser());

  router.get(
    '/templates/by-stamp-request/:stampRequestId',
    validateParams(stampRequestIdParamsSchema),
    stampLabelTemplateController.resolveByStampRequestId,
  );

  adminRouter.get('/templates', stampLabelTemplateController.list);
  adminRouter.get(
    '/templates/:id',
    validateParams(stampLabelTemplateIdParamsSchema),
    stampLabelTemplateController.getById,
  );
  adminRouter.post(
    '/templates',
    validateBody(stampLabelTemplateBodySchema),
    stampLabelTemplateController.create,
  );
  adminRouter.patch(
    '/templates/:id',
    validateParams(stampLabelTemplateIdParamsSchema),
    validateBody(stampLabelTemplatePatchSchema),
    stampLabelTemplateController.update,
  );
  adminRouter.delete(
    '/templates/:id',
    validateParams(stampLabelTemplateIdParamsSchema),
    stampLabelTemplateController.delete,
  );

  return { router, adminRouter };
};
