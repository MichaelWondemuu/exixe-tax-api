import { createAsyncRouter } from '../../../shared/middleware/exception.handler.js';
import {
  validateBody,
  validateParams,
} from '../../../shared/middleware/validate.middleware.js';
import { authMiddleware, requireSystemUser } from '../middleware/index.js';
import {
  assignResourcePermissionsBodySchema,
} from '../validators/role.validator.js';
import {
  createOrganizationBodySchema,
  updateOrganizationBodySchema,
} from '../validators/organization.validator.js';
import {
  createResourceBodySchema,
  updateResourceBodySchema,
} from '../validators/resource.validator.js';
import {
  createUserInOrganizationBodySchema,
} from '../validators/user.validator.js';
import {
  idParamSchema,
  systemOrganizationUsersParamSchema,
} from '../validators/common.params.js';
import { unbanLoginClientBodySchema } from '../validators/auth-flow.validator.js';

/**
 * System Routes
 *  version: 1.0.0
 * All routes under /system require system user privileges.
 * System users can perform administrative operations across all organizations.
 */

export const buildSystemRouter = ({
  authController,
  organizationController,
  roleController,
  resourceController,
  systemReportController,
}) => {
  const router = createAsyncRouter();

  // Apply authentication and system user requirement to all routes
  router.use(authMiddleware());
  router.use(requireSystemUser());

  router.get('/user-report', systemReportController.getSystemUserReport);
  router.post('/login-bans/unban', authController.unbanLoginClient);

  // Organization routes
  router.post('/organizations', organizationController.createOrganization);
  router.get('/organizations', organizationController.listOrganizations);
  router.get('/organizations/:id', organizationController.getOrganization);
  router.put('/organizations/:id', organizationController.updateOrganization);
  router.delete(
    '/organizations/:id',
    organizationController.deleteOrganization,
  );
  router.post(
    '/organizations/users',
    organizationController.createUserInOrganization,
  );
  router.get(
    '/organizations/users/:organizationID',
    organizationController.listUsersInOrganization,
  );

  // Resource routes (system only)
  router.post('/resources', resourceController.createResource);
  router.put('/resources/:id', resourceController.updateResource);
  router.delete('/resources/:id', resourceController.deleteResource);

  // Role resource-permissions assignment (system only)
  router.post(
    '/roles/:id/resource-permissions',
    roleController.assignResourcePermissions,
  );

  return router;
};
