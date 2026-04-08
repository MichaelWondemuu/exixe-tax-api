import express from 'express';
import {
  validateBody,
  validateParams,
} from '../../../shared/middleware/validate.middleware.js';
import { idParamsSchema } from '../schemas/common.schemas.js';
import { forecastBodySchema, forecastPatchSchema } from '../schemas/forecast.schemas.js';

export const buildForecastRouter = ({ forecastController }) => {
  const router = express.Router();
  const adminRouter = express.Router();

  router.get('/forecasts', forecastController.list);
  router.get(
    '/forecasts/:id',
    validateParams(idParamsSchema),
    forecastController.getById,
  );
  router.post(
    '/forecasts',
    validateBody(forecastBodySchema),
    forecastController.create,
  );
  router.patch(
    '/forecasts/:id',
    validateParams(idParamsSchema),
    validateBody(forecastPatchSchema),
    forecastController.update,
  );
  router.post(
    '/forecasts/:id/submit',
    validateParams(idParamsSchema),
    forecastController.submit,
  );

  adminRouter.get('/forecasts', forecastController.list);
  adminRouter.get(
    '/forecasts/:id',
    validateParams(idParamsSchema),
    forecastController.getById,
  );

  return { router, adminRouter };
};

