import express from 'express';
import {
  authMiddleware,
  requireSystemUser,
} from '../../auth/middleware/index.js';
import { ignoreOrganizationFilter } from '../../../shared/decorators/route-metadata.js';

export const buildOrgRegistrationPublicRouter = ({ publicController }) => {
  const router = express.Router();

  router.post(
    '/applications',
    ignoreOrganizationFilter(publicController.submitApplication),
  );
  router.get(
    '/applications/:id',
    ignoreOrganizationFilter(publicController.getApplication),
  );

  return router;
};

export const buildOrgRegistrationAdminRouter = ({ adminController }) => {
  const router = express.Router();

  router.use(authMiddleware());
  router.use(requireSystemUser());

  router.get(
    '/applications',
    ignoreOrganizationFilter(adminController.listApplications),
  );
  router.patch(
    '/applications/:id/status',
    ignoreOrganizationFilter(adminController.updateStatus),
  );

  return router;
};
