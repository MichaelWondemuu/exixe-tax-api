import { createAsyncRouter } from '../../../shared/middleware/exception.handler.js';
import {
  validateBody,
  validateParams,
} from '../../../shared/middleware/validate.middleware.js';
import { loginBodySchema } from '../validators/login.validator.js';
import { refreshTokenBodySchema } from '../validators/refresh-token.validator.js';
import {
  completeLoginWithMfaBodySchema,
  resetPasswordBodySchema,
  sendOtpBodySchema,
  updatePasswordBodySchema,
} from '../validators/auth-flow.validator.js';
import { idParamSchema } from '../validators/common.params.js';
import {
  Anonymous,
  registerRouteMetadata,
} from '../../../shared/decorators/route-metadata.js';
import { authMiddleware } from '../middleware/index.js';

export const buildAuthRouter = ({ controller }) => {
  const router = createAsyncRouter();

  // registerRouteMetadata('POST', '/login', { anonymous: true });
  // registerRouteMetadata('POST', '/send-otp', { anonymous: true });
  // registerRouteMetadata('POST', '/reset-password', { anonymous: true });
  // registerRouteMetadata('POST', '/refresh', { anonymous: true });
  // registerRouteMetadata('POST', '/login/mfa', { anonymous: true });
  // registerRouteMetadata('GET', '/health', { anonymous: true });
  registerRouteMetadata('GET', '/test', { anonymous: true });

  router.post(
    '/login',
    validateBody(loginBodySchema),
    Anonymous(controller.login),
  );
  router.post(
    '/send-otp',
    validateBody(sendOtpBodySchema),
    Anonymous(controller.sendOtp),
  );
  router.post(
    '/reset-password',
    validateBody(resetPasswordBodySchema),
    Anonymous(controller.resetPassword),
  );

  router.get('/health', Anonymous(controller.health));

  // Simple test endpoint to verify requests reach the application
  router.get(
    '/test',
    Anonymous((req, res) => {
      res.json({
        message: 'Request reached the application successfully',
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
        headers: {
          'user-agent': req.get('user-agent'),
          'x-forwarded-for': req.get('x-forwarded-for'),
          'x-real-ip': req.get('x-real-ip'),
        },
      });
    }),
  );

  router.post(
    '/refresh',
    validateBody(refreshTokenBodySchema),
    Anonymous(controller.refreshToken),
  );

  router.get('/me', authMiddleware(), controller.getCurrentUser);

  router.put(
    '/password/update/:id',
    authMiddleware(),
    controller.updatePassword,
  );

  router.post('/logout', authMiddleware(), controller.logout);

  router.post('/login/mfa', Anonymous(controller.completeLoginWithMfa));

  return router;
};
