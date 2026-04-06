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
import {
  idParamSchema,
  organizationIdParamSchema,
  walletTypeParamSchema,
} from '../validators/common.params.js';
import {
  createOrganizationBodySchema,
  organizationDetailBodySchema,
  updateOrganizationBodySchema,
  upsertOrgWalletBodySchema,
} from '../validators/organization.validator.js';

export const buildOrganizationRouter = ({ controller }) => {
  const router = createAsyncRouter();
  router.use(authMiddleware());

  router.get(
    '/',
    requirePermission(['organization:li', 'organization:ma']),
    ignoreOrganizationFilter(controller.listOrganizations),
  );
  router.get(
    '/:id/einvoice-cnf',
    validateParams(idParamSchema),
    requirePermission(['organization:up', 'organization:ma']),
    ignoreOrganizationFilter(controller.getEinvoiceCnf),
  );
  router.get(
    '/:organizationId/details',
    validateParams(organizationIdParamSchema),
    requirePermission(['organization:re', 'organization:ma']),
    ignoreOrganizationFilter(controller.getOrganizationDetail),
  );
  router.post(
    '/:organizationId/details',
    validateParams(organizationIdParamSchema),
    requirePermission(['organization:ce', 'organization:ma']),
    validateBody(organizationDetailBodySchema),
    ignoreOrganizationFilter(controller.createOrganizationDetail),
  );
  router.put(
    '/:organizationId/details',
    validateParams(organizationIdParamSchema),
    requirePermission(['organization:up', 'organization:ma']),
    validateBody(organizationDetailBodySchema),
    ignoreOrganizationFilter(controller.updateOrganizationDetail),
  );
  router.delete(
    '/:organizationId/details',
    validateParams(organizationIdParamSchema),
    requirePermission(['organization:up', 'organization:ma']),
    ignoreOrganizationFilter(controller.deleteOrganizationDetail),
  );
  router.get(
    '/:id',
    validateParams(idParamSchema),
    requirePermission(['organization:re', 'organization:ma']),
    ignoreOrganizationFilter(controller.getOrganization),
  );
  router.post(
    '/',
    requireSystemUser(),
    validateBody(createOrganizationBodySchema),
    controller.createOrganization,
  );
  router.put(
    '/:id',
    validateParams(idParamSchema),
    requireSystemUser(),
    validateBody(updateOrganizationBodySchema),
    controller.updateOrganization,
  );
  router.delete(
    '/:id',
    validateParams(idParamSchema),
    requireSystemUser(),
    controller.deleteOrganization,
  );

  // Organization Wallets (accessible to org admins, not just system users)
  router.get(
    '/:organizationId/wallets',
    validateParams(organizationIdParamSchema),
    requirePermission(['organization:re', 'organization:ma']),
    ignoreOrganizationFilter(controller.listOrgWallets),
  );
  router.put(
    '/:organizationId/wallets',
    validateParams(organizationIdParamSchema),
    requirePermission(['organization:up', 'organization:ma']),
    validateBody(upsertOrgWalletBodySchema),
    ignoreOrganizationFilter(controller.upsertOrgWallet),
  );
  router.delete(
    '/:organizationId/wallets/:walletType',
    validateParams(walletTypeParamSchema),
    requirePermission(['organization:up', 'organization:ma']),
    ignoreOrganizationFilter(controller.deleteOrgWallet),
  );

  return router;
};
