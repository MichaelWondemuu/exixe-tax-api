import express from 'express';
import { authMiddleware } from '../../auth/middleware/index.js';
import {
  validateBody,
  validateParams,
  yup,
} from '../../../shared/middleware/validate.middleware.js';

const packagingBodySchema = yup.object({
  name: yup.string().trim().min(2).max(255).required(),
});

const packagingIdParamsSchema = yup.object({
  id: yup.string().uuid().required(),
});

/**
 * @param {{ packagingController: import('../controllers/packaging.controller.js').PackagingController }} deps
 */
export const buildPackagingRouter = ({ packagingController }) => {
  const router = express.Router();
  router.use(authMiddleware());

  router.get('/', packagingController.listPackagings);
  router.get(
    '/:id',
    validateParams(packagingIdParamsSchema),
    packagingController.getPackagingById,
  );
  router.post(
    '/',
    validateBody(packagingBodySchema),
    packagingController.createPackaging,
  );
  router.put(
    '/:id',
    validateParams(packagingIdParamsSchema),
    validateBody(packagingBodySchema),
    packagingController.updatePackaging,
  );
  router.delete(
    '/:id',
    validateParams(packagingIdParamsSchema),
    packagingController.deletePackaging,
  );
  return router;
};
