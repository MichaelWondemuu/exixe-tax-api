import { createAsyncRouter } from '../../../shared/middleware/exception.handler.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { pinVerificationMiddleware } from '../middleware/pin-verification.middleware.js';

export function buildPinAuthRouter({ controller }) {
  const router = createAsyncRouter();

  // Verify PIN (requires userId + pin, no device session needed)
  router.post('/verify', authMiddleware(), controller.verifyPin);

  // Set PIN for a user (requires authentication)
  router.post('/set', authMiddleware(), controller.setPin); // Body: { pin }

  // Get public key for PIN encryption (no auth required - public key is safe to share)
  router.get('/public-key', controller.getPublicKey);

  // Test endpoint for PIN verification middleware
  // Requires: JWT auth + PIN verification
  // Headers: x-user-id, x-pin (encrypted or plain)
  router.post(
    '/test',
    authMiddleware(),
    pinVerificationMiddleware(),
    controller.testPinVerification,
  );

  return router;
}
