import { createAsyncRouter } from '../../../shared/middleware/exception.handler.js';
import {
  validateBody,
  validateParams,
} from '../../../shared/middleware/validate.middleware.js';
import { authMiddleware, requirePermission } from '../middleware/index.js';
import { ignoreOrganizationFilter } from '../../../shared/decorators/route-metadata.js';
import { idParamSchema } from '../validators/common.params.js';
import {
  createResourcePermissionBodySchema,
  updateResourcePermissionBodySchema,
} from '../validators/resource-permission.validator.js';

export const buildResourcePermissionRouter = ({ controller }) => {
  const router = createAsyncRouter();
  router.use(authMiddleware());

  router.get(
    '/',
    requirePermission('resource:li', 'resource:ma'),
    ignoreOrganizationFilter(controller.listResourcePermissions),
  );

  router.get(
    '/:id',
    validateParams(idParamSchema),
    requirePermission('resource:re', 'resource:ma'),
    ignoreOrganizationFilter(controller.getResourcePermission),
  );

  router.post(
    '/',
    requirePermission('resource:ce', 'resource:ma'),
    validateBody(createResourcePermissionBodySchema),
    ignoreOrganizationFilter(controller.createResourcePermission),
  );

  router.put(
    '/:id',
    validateParams(idParamSchema),
    requirePermission('resource:up', 'resource:ma'),
    validateBody(updateResourcePermissionBodySchema),
    ignoreOrganizationFilter(controller.updateResourcePermission),
  );

  router.delete(
    '/:id',
    validateParams(idParamSchema),
    requirePermission('resource:de', 'resource:ma'),
    ignoreOrganizationFilter(controller.deleteResourcePermission),
  );

  return router;
};
