import express from 'express';
import {
  validateBody,
  validateParams,
} from '../../../shared/middleware/validate.middleware.js';
import { idParamsSchema } from '../schemas/common.schemas.js';
import { facilityBodySchema, facilityPatchSchema } from '../schemas/facility.schemas.js';

export const buildFacilityRouter = ({ facilityController }) => {
  const router = express.Router();

  router.get('/facilities', facilityController.list);
  router.get(
    '/facilities/:id',
    validateParams(idParamsSchema),
    facilityController.getById,
  );
  router.post(
    '/facilities',
    validateBody(facilityBodySchema),
    facilityController.create,
  );
  router.patch(
    '/facilities/:id',
    validateParams(idParamsSchema),
    validateBody(facilityPatchSchema),
    facilityController.update,
  );

  return router;
};

