import { createAuthModule } from './modules/auth/auth.module.js';
import { createReportModule } from './modules/report/report.module.js';
import { createLookupModule } from './modules/lookup/lookup.module.js';
import { createRegistrationModule } from './modules/registration/registration.module.js';
import { createProductModule } from './modules/product/product.module.js';
import { createAsyncRouter } from './shared/middleware/exception.handler.js';

const router = createAsyncRouter();

/**
 * Register all application routes
 * @param {import('express').Express} app
 * @param {string} baseUrl
 */
export const registerRoutes = (app, baseUrl) => {
  const authModule = createAuthModule();
  const reportModule = createReportModule();
  const lookupModule = createLookupModule();
  const registrationModule = createRegistrationModule();
  const productModule = createProductModule();
  // modules/auth/auth.routes.js
  // #swagger.tags = ['Auth']
  router.use('/auth', authModule.router);
  router.use('/lookup', lookupModule.router);
  router.use('/registrations', registrationModule.router);
  router.use('/products', productModule.router);
  router.use('/', reportModule.router);

  app.use(baseUrl, router);
};
