import express from 'express';
import {
  validateBody,
  validateParams,
} from '../../../shared/middleware/validate.middleware.js';
import {
  exciseConfigCreateBodySchema,
  exciseConfigKeyParamsSchema,
  exciseConfigUpdateBodySchema,
} from '../schemas/config.schemas.js';

export const buildExciseConfigRouter = ({ exciseConfigController }) => {
  const adminRouter = express.Router();

  adminRouter.get('/configs', exciseConfigController.list);
  adminRouter.get(
    '/configs/:key',
    validateParams(exciseConfigKeyParamsSchema),
    exciseConfigController.getByKey,
  );
  adminRouter.post(
    '/configs',
    validateBody(exciseConfigCreateBodySchema),
    exciseConfigController.create,
  );
  adminRouter.patch(
    '/configs/:key',
    validateParams(exciseConfigKeyParamsSchema),
    validateBody(exciseConfigUpdateBodySchema),
    exciseConfigController.update,
  );
  adminRouter.delete(
    '/configs/:key',
    validateParams(exciseConfigKeyParamsSchema),
    exciseConfigController.delete,
  );

  return { adminRouter };
};
