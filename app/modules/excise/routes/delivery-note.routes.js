import express from 'express';
import {
  validateBody,
  validateParams,
} from '../../../shared/middleware/validate.middleware.js';
import { idParamsSchema } from '../schemas/common.schemas.js';
import {
  deliveryNoteBodySchema,
  deliveryNoteStatusSchema,
} from '../schemas/delivery-note.schemas.js';
import { authMiddleware } from '../../auth/middleware/auth.middleware.js';

export const buildDeliveryNoteRouter = ({ deliveryNoteController }) => {
  const router = express.Router();
  router.use(authMiddleware());

  router.get('/delivery-notes', deliveryNoteController.list);
  router.get(
    '/delivery-notes/:id',
    validateParams(idParamsSchema),
    deliveryNoteController.getById,
  );
  router.post(
    '/delivery-notes',
    validateBody(deliveryNoteBodySchema),
    deliveryNoteController.create,
  );
  router.patch(
    '/delivery-notes/:id/status',
    validateParams(idParamsSchema),
    validateBody(deliveryNoteStatusSchema),
    deliveryNoteController.updateStatus,
  );

  return router;
};

