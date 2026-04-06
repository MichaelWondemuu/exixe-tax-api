import express from 'express';

/**
 * @param {{ verificationBodyController: import('../controllers/verification-body.controller.js').VerificationBodyController }} deps
 */
export const buildVerificationBodyRouter = ({ verificationBodyController }) => {
  const router = express.Router();
  router.get('/', verificationBodyController.listVerificationBodies);
  router.get('/:id', verificationBodyController.getVerificationBodyById);
  return router;
};
