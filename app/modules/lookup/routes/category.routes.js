import express from 'express';

/**
 * @param {{ categoryController: import('../controllers/category.controller.js').CategoryController }} deps
 */
export const buildCategoryRouter = ({ categoryController }) => {
  const router = express.Router();
  router.get('/', categoryController.listCategories);
  router.get('/:id', categoryController.getCategoryById);
  router.post('/', categoryController.createCategory);
  router.put('/:id', categoryController.updateCategory);
  router.delete('/:id', categoryController.deleteCategory);
  return router;
};
