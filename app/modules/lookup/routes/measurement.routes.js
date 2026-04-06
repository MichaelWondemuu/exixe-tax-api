import express from 'express';
import { authMiddleware } from '../../auth/middleware/index.js';
import {
  validateBody,
  validateParams,
  yup,
} from '../../../shared/middleware/validate.middleware.js';

const measurementBodySchema = yup.object({
  name: yup.string().trim().min(1).max(255).required(),
  shortForm: yup.string().trim().min(1).max(50).nullable(),
});

const measurementIdParamsSchema = yup.object({
  id: yup.string().uuid().required(),
});

/**
 * @param {{ measurementController: import('../controllers/measurement.controller.js').MeasurementController }} deps
 */
export const buildMeasurementRouter = ({ measurementController }) => {
  const router = express.Router();
  router.use(authMiddleware());

  router.get('/', measurementController.listMeasurements);
  router.get(
    '/:id',
    validateParams(measurementIdParamsSchema),
    measurementController.getMeasurementById,
  );
  router.post(
    '/',
    validateBody(measurementBodySchema),
    measurementController.createMeasurement,
  );
  router.put(
    '/:id',
    validateParams(measurementIdParamsSchema),
    validateBody(measurementBodySchema),
    measurementController.updateMeasurement,
  );
  router.delete(
    '/:id',
    validateParams(measurementIdParamsSchema),
    measurementController.deleteMeasurement,
  );
  return router;
};
