import express from 'express';
import { authMiddleware } from '../../auth/middleware/index.js';
import {
  validateBody,
  validateParams,
  yup,
} from '../../../shared/middleware/validate.middleware.js';

const categoryBodySchema = yup.object({
  name: yup.string().trim().min(2).max(255).required(),
  code: yup.string().trim().min(1).max(100).required(),
  status: yup
    .string()
    .trim()
    .transform((v) => (v ? String(v).trim().toUpperCase() : 'ACTIVE'))
    .oneOf(['ACTIVE', 'INACTIVE'])
    .default('ACTIVE'),
  color: yup.string().trim().max(30).nullable(),
  description: yup.string().trim().max(2000).nullable(),
});

const categoryIdParamsSchema = yup.object({
  id: yup.string().uuid().required(),
});

/**
 * @param {{ categoryController: import('../controllers/category.controller.js').CategoryController }} deps
 */
export const buildCategoryRouter = ({ categoryController }) => {
  const router = express.Router();
  router.use(authMiddleware());

  router.get('/', categoryController.listCategories);
  router.get(
    '/:id',
    validateParams(categoryIdParamsSchema),
    categoryController.getCategoryById,
  );
  router.post(
    '/',
    validateBody(categoryBodySchema),
    categoryController.createCategory,
  );
  router.put(
    '/:id',
    validateParams(categoryIdParamsSchema),
    validateBody(categoryBodySchema),
    categoryController.updateCategory,
  );
  router.delete(
    '/:id',
    validateParams(categoryIdParamsSchema),
    categoryController.deleteCategory,
  );
  return router;
};
