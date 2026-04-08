import express from 'express';
import { authMiddleware } from '../../auth/middleware/index.js';
import {
  validateBody,
  validateParams,
  yup,
} from '../../../shared/middleware/validate.middleware.js';

const idParamsSchema = yup.object({
  id: yup.string().uuid().required(),
});

const itemBodySchema = yup.object({
  productId: yup.string().uuid().required(),
  productVariantId: yup.string().uuid().nullable(),
  quantity: yup.number().moreThan(0).required(),
  unitValueSnapshot: yup.number().moreThan(0).nullable(),
  sellingPriceSnapshot: yup.number().min(0).nullable(),
  remarks: yup.string().trim().max(2000).nullable(),
});

const predeclarationBodySchema = yup.object({
  declarationDate: yup.string().required(),
  arrivalDate: yup.string().required(),
  remarks: yup.string().trim().max(2000).nullable(),
  items: yup.array().of(itemBodySchema).min(1).required(),
});

const remarksBodySchema = yup.object({
  remarks: yup.string().trim().max(2000).nullable(),
});

/**
 * @param {{ predeclarationController: import('../controllers/predeclaration.controller.js').PredeclarationController }} deps
 */
export const buildPredeclarationRouter = ({ predeclarationController }) => {
  const router = express.Router();
  router.use(authMiddleware());

  router.get('/', predeclarationController.listPredeclarations);
  router.get(
    '/:id',
    validateParams(idParamsSchema),
    predeclarationController.getPredeclarationById,
  );
  router.post(
    '/',
    validateBody(predeclarationBodySchema),
    predeclarationController.createPredeclaration,
  );
  router.put(
    '/:id',
    validateParams(idParamsSchema),
    validateBody(predeclarationBodySchema),
    predeclarationController.updatePredeclaration,
  );
  router.delete(
    '/:id',
    validateParams(idParamsSchema),
    predeclarationController.deletePredeclaration,
  );
  router.post(
    '/:id/submit',
    validateParams(idParamsSchema),
    predeclarationController.submitPredeclaration,
  );
  router.post(
    '/:id/approve',
    validateParams(idParamsSchema),
    predeclarationController.approvePredeclaration,
  );
  router.post(
    '/:id/reject',
    validateParams(idParamsSchema),
    validateBody(remarksBodySchema),
    predeclarationController.rejectPredeclaration,
  );
  router.post(
    '/:id/cancel',
    validateParams(idParamsSchema),
    validateBody(remarksBodySchema),
    predeclarationController.cancelPredeclaration,
  );

  return router;
};
