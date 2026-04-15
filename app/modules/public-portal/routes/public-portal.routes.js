import express from 'express';
import {
  authMiddleware,
  requireSystemUser,
} from '../../auth/middleware/index.js';
import {
  validateBody,
  validateParams,
} from '../../../shared/middleware/validate.middleware.js';
import {
  portalAdminAnnouncementBodySchema,
  portalAdminNotificationBodySchema,
  portalAdminUpdateReportStatusBodySchema,
  portalCreateReportBodySchema,
  portalProductIdParamsSchema,
  portalReportReferenceParamsSchema,
  portalVerifyBodySchema,
} from '../schemas/public-portal.schemas.js';

export const buildPublicPortalRouter = ({ publicPortalController }) => {
  const router = express.Router();
  const adminRouter = express.Router();
  adminRouter.use(authMiddleware());
  adminRouter.use(requireSystemUser());

  router.post(
    '/verification',
    validateBody(portalVerifyBodySchema),
    publicPortalController.verifyStamp,
  );
  router.get('/announcements', publicPortalController.listAnnouncements);
  router.get('/restricted-products', publicPortalController.listRestrictedProducts);
  router.get('/products', publicPortalController.listProducts);
  router.get(
    '/products/:productId/variants',
    validateParams(portalProductIdParamsSchema),
    publicPortalController.listProductVariants,
  );
  router.get('/product-types', publicPortalController.listProductTypes);
  router.get('/categories', publicPortalController.listCategories);
  router.get('/catalog/bootstrap', publicPortalController.getCatalogBootstrap);
  router.post(
    '/reports',
    validateBody(portalCreateReportBodySchema),
    publicPortalController.createReport,
  );
  router.get(
    '/reports/:reference',
    validateParams(portalReportReferenceParamsSchema),
    publicPortalController.getReportStatus,
  );
  router.get('/notifications', publicPortalController.listNotifications);

  adminRouter.post(
    '/announcements',
    validateBody(portalAdminAnnouncementBodySchema),
    publicPortalController.adminCreateAnnouncement,
  );
  adminRouter.get('/reports', publicPortalController.adminListReports);
  adminRouter.patch(
    '/reports/:reference',
    validateParams(portalReportReferenceParamsSchema),
    validateBody(portalAdminUpdateReportStatusBodySchema),
    publicPortalController.adminUpdateReportStatus,
  );
  adminRouter.post(
    '/notifications',
    validateBody(portalAdminNotificationBodySchema),
    publicPortalController.adminCreateNotification,
  );
  router.use('/admin', adminRouter);

  return router;
};
