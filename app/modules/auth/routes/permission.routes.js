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
  createPermissionBodySchema,
  updatePermissionBodySchema,
} from '../validators/permission.validator.js';

export const buildPermissionRouter = ({ controller }) => {
  const router = createAsyncRouter();
  router.use(authMiddleware());
  router.get(
    '/',
    requirePermission('permission:li', 'permission:ma'),
    ignoreOrganizationFilter(controller.listPermissions),
  );

  router.get(
    '/:id',
    validateParams(idParamSchema),
    requirePermission('permission:re', 'permission:ma'),
    ignoreOrganizationFilter(controller.getPermission),
  );

  router.post(
    '/',
    requireSystemUser(),
    validateBody(createPermissionBodySchema),
    ignoreOrganizationFilter(controller.createPermission),
  );

  router.put(
    '/:id',
    validateParams(idParamSchema),
    requireSystemUser(),
    validateBody(updatePermissionBodySchema),
    ignoreOrganizationFilter(controller.updatePermission),
  );

  router.delete(
    '/:id',
    validateParams(idParamSchema),
    requireSystemUser(),
    ignoreOrganizationFilter(controller.deletePermission),
  );

  return router;
};
