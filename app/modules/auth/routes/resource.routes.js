import { createAsyncRouter } from '../../../shared/middleware/exception.handler.js';
import {
  validateBody,
  validateParams,
} from '../../../shared/middleware/validate.middleware.js';
import {
  authMiddleware,
  requirePermission,
  requireSystemUser,
} from '../middleware/index.js';
import { ignoreOrganizationFilter } from '../../../shared/decorators/route-metadata.js';
import { idParamSchema } from '../validators/common.params.js';
import {
  createResourceBodySchema,
  updateResourceBodySchema,
} from '../validators/resource.validator.js';

export const buildResourceRouter = ({ controller }) => {
  const router = createAsyncRouter();
  router.use(authMiddleware());
  router.get(
    '/',
    requirePermission('resource:li', 'resource:ma'),
    ignoreOrganizationFilter(controller.listResources),
  );

  router.get(
    '/:id',
    validateParams(idParamSchema),
    requirePermission('resource:re', 'resource:ma'),
    ignoreOrganizationFilter(controller.getResource),
  );

  router.post(
    '/',
    requireSystemUser(),
    validateBody(createResourceBodySchema),
    ignoreOrganizationFilter(controller.createResource),
  );

  router.put(
    '/:id',
    validateParams(idParamSchema),
    requireSystemUser(),
    validateBody(updateResourceBodySchema),
    ignoreOrganizationFilter(controller.updateResource),
  );

  router.delete(
    '/:id',
    validateParams(idParamSchema),
    requireSystemUser(),
    ignoreOrganizationFilter(controller.deleteResource),
  );

  return router;
};
