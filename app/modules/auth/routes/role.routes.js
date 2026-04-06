import { createAsyncRouter } from '../../../shared/middleware/exception.handler.js';
import {
  validateBody,
  validateParams,
} from '../../../shared/middleware/validate.middleware.js';
import { authMiddleware, requirePermission } from '../middleware/index.js';
import { ignoreOrganizationFilter } from '../../../shared/decorators/route-metadata.js';
import { idParamSchema } from '../validators/common.params.js';
import {
  assignResourcePermissionsBodySchema,
  createRoleBodySchema,
  updateRoleBodySchema,
} from '../validators/role.validator.js';

export const buildRoleRouter = ({ controller }) => {
  const router = createAsyncRouter();
  router.use(authMiddleware());
  router.get(
    '/',
    requirePermission('role:li', 'role:ma'),
    ignoreOrganizationFilter(controller.listRoles),
  );

  router.get(
    '/:id',
    validateParams(idParamSchema),
    requirePermission('role:re', 'role:ma'),
    ignoreOrganizationFilter(controller.getRole),
  );
  router.post(
    '/',
    requirePermission('role:ce', 'role:ma'),
    validateBody(createRoleBodySchema),
    controller.createRole,
  );
  router.put(
    '/:id',
    validateParams(idParamSchema),
    requirePermission('role:up', 'role:ma'),
    validateBody(updateRoleBodySchema),
    controller.updateRole,
  );
  router.delete(
    '/:id',
    validateParams(idParamSchema),
    requirePermission('role:de', 'role:ma'),
    controller.deleteRole,
  );
  router.post(
    '/:id/resource-permissions',
    validateParams(idParamSchema),
    requirePermission('role:up', 'role:ma'),
    validateBody(assignResourcePermissionsBodySchema),
    controller.assignResourcePermissions,
  );

  return router;
};
