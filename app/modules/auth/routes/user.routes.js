import { createAsyncRouter } from '../../../shared/middleware/exception.handler.js';
import {
  validateBody,
  validateParams,
} from '../../../shared/middleware/validate.middleware.js';
import { authMiddleware, requirePermission } from '../middleware/index.js';
import { filterOrganizationWithChildren } from '../../../shared/decorators/route-metadata.js';
import {
  idParamSchema,
  userPhoneParamSchema,
} from '../validators/common.params.js';
import {
  assignRolesBodySchema,
  createUserBodySchema,
  updateUserBodySchema,
} from '../validators/user.validator.js';

export const buildUserRouter = ({ controller }) => {
  const router = createAsyncRouter();
  router.use(authMiddleware());
  router.get(
    '/',
    requirePermission(['user:li', 'user:ma']),
    filterOrganizationWithChildren(controller.listUsers),
  );

  router.get(
    '/get-user-by-phone/:phone',
    validateParams(userPhoneParamSchema),
    controller.getUserByPhone,
  );

  router.get(
    '/:id',
    validateParams(idParamSchema),
    requirePermission(['user:re', 'user:ma']),
    controller.getUser,
  );

  router.post(
    '/',
    requirePermission(['user:ce', 'user:ma']),
    validateBody(createUserBodySchema),
    controller.createUser,
  );

  router.put(
    '/:id',
    validateParams(idParamSchema),
    requirePermission(['user:up', 'user:ma']),
    validateBody(updateUserBodySchema),
    controller.updateUser,
  );

  router.delete(
    '/:id',
    validateParams(idParamSchema),
    requirePermission(['user:de', 'user:ma']),
    controller.deleteUser,
  );

  router.post(
    '/:id/roles',
    validateParams(idParamSchema),
    requirePermission(['user:up', 'user:ma']),
    validateBody(assignRolesBodySchema),
    controller.assignRoles,
  );

  router.post(
    '/:id/pin-login/enable',
    validateParams(idParamSchema),
    controller.enablePinLogin,
  );

  router.post(
    '/:id/pin-login/disable',
    validateParams(idParamSchema),
    controller.disablePinLogin,
  );

  return router;
};
