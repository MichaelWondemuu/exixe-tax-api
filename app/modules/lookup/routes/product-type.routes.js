import express from 'express';
import { authMiddleware } from '../../auth/middleware/index.js';
import {
  validateBody,
  validateParams,
  yup,
} from '../../../shared/middleware/validate.middleware.js';

const productTypeBodySchema = yup.object({
  name: yup.string().trim().min(2).max(255).required(),
});

const productTypeIdParamsSchema = yup.object({
  id: yup.string().uuid().required(),
});

/**
 * @param {{ productTypeController: import('../controllers/product-type.controller.js').ProductTypeController }} deps
 */
export const buildProductTypeRouter = ({ productTypeController }) => {
  const router = express.Router();
  router.use(authMiddleware());

  router.get('/', productTypeController.listProductTypes);
  router.get(
    '/:id',
    validateParams(productTypeIdParamsSchema),
    productTypeController.getProductTypeById,
  );
  router.post(
    '/',
    validateBody(productTypeBodySchema),
    productTypeController.createProductType,
  );
  router.put(
    '/:id',
    validateParams(productTypeIdParamsSchema),
    validateBody(productTypeBodySchema),
    productTypeController.updateProductType,
  );
  router.delete(
    '/:id',
    validateParams(productTypeIdParamsSchema),
    productTypeController.deleteProductType,
  );
  return router;
};
