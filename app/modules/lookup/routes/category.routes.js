import express from 'express';
import { authMiddleware } from '../../auth/middleware/index.js';
import {
  validateBody,
  validateParams,
  yup,
} from '../../../shared/middleware/validate.middleware.js';

const categoryBodySchema = yup.object({
  name: yup.string().trim().min(2).max(255).required(),
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
