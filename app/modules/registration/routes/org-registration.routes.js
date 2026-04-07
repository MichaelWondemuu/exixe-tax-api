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
    '/applications/reference/:reference',
    ignoreOrganizationFilter(publicController.getApplicationByReference),
  );
  router.get(
    '/applications/status/:code',
    ignoreOrganizationFilter(publicController.getApplicationByTrackingCode),
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

  // Backward-compatible shortcut for existing clients calling /admin directly.
  router.get('/', ignoreOrganizationFilter(adminController.listApplications));
  router.get(
    '/applications',
    ignoreOrganizationFilter(adminController.listApplications),
  );
  router.get(
    '/applications/:id',
    ignoreOrganizationFilter(adminController.getApplication),
  );
  router.patch(
    '/applications/:id',
    ignoreOrganizationFilter(adminController.adjustApplication),
  );
  router.patch(
    '/applications/:id/status',
    ignoreOrganizationFilter(adminController.updateStatus),
  );
  // Backward-compatible shortcut for existing clients.
  router.post(
    '/applications/:id/under-review',
    ignoreOrganizationFilter(adminController.markUnderReview),
  );

  return router;
};
