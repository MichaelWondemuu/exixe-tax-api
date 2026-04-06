import express from 'express';

/**
 * @param {{ licensingAuthorityController: import('../controllers/licensing-authority.controller.js').LicensingAuthorityController }} deps
 */
export const buildLicensingAuthorityRouter = ({
  licensingAuthorityController,
}) => {
  const router = express.Router();
  router.get('/', licensingAuthorityController.listLicensingAuthorities);
  router.get('/:id', licensingAuthorityController.getLicensingAuthorityById);
  return router;
};
