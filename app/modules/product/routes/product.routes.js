import express from 'express';
import { authMiddleware } from '../../auth/middleware/index.js';
import {
  validateBody,
  validateParams,
  yup,
} from '../../../shared/middleware/validate.middleware.js';
import { createSingleImageUploadMiddleware } from '../../../shared/utils/file-upload.util.js';

const productBodySchema = yup.object({
  name: yup.string().trim().min(1).max(255).required(),
  description: yup.string().trim().max(2000).nullable(),
  sku: yup.string().trim().max(100).nullable(),
  categoryId: yup.string().uuid().required(),
  productTypeId: yup.string().uuid().required(),
  measurementId: yup.string().uuid().required(),
  unitValue: yup.number().moreThan(0).required(),
  sellingPrice: yup.number().min(0).required(),
  isActive: yup.boolean().required(),
});

const productIdParamsSchema = yup.object({
  id: yup.string().uuid().required(),
});

const parseOptionalProductImage = createSingleImageUploadMiddleware({
  fieldName: 'image',
  maxFileSizeBytes: 5 * 1024 * 1024,
});

/**
 * @param {{ productController: import('../controllers/product.controller.js').ProductController }} deps
 */
export const buildProductRouter = ({ productController }) => {
  const router = express.Router();
  router.use(authMiddleware());

  router.get('/', productController.listProducts);
  router.get(
    '/:id',
    validateParams(productIdParamsSchema),
    productController.getProductById,
  );
  router.post(
    '/',
    parseOptionalProductImage,
    validateBody(productBodySchema),
    productController.createProduct,
  );
  router.put(
    '/:id',
    validateParams(productIdParamsSchema),
    parseOptionalProductImage,
    validateBody(productBodySchema),
    productController.updateProduct,
  );
  router.delete(
    '/:id',
    validateParams(productIdParamsSchema),
    productController.deleteProduct,
  );
  return router;
};
