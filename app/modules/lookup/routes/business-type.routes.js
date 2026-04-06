import express from 'express';

/**
 * @param {{ businessTypeController: import('../controllers/business-type.controller.js').BusinessTypeController }} deps
 */
export const buildBusinessTypeRouter = ({ businessTypeController }) => {
  const router = express.Router();
  router.get('/', businessTypeController.listBusinessTypes);
  return router;
};
