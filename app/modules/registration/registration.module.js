import { createAsyncRouter } from '../../shared/middleware/exception.handler.js';
import { BusinessTypeRepository } from '../lookup/repository/business-type.repository.js';
import { OrgRegistrationApplicationRepository } from './repository/org-registration-application.repository.js';
import { OrgRegistrationService } from './usecases/org-registration/org-registration.service.js';
import { OrgRegistrationCommandService } from './usecases/org-registration/org-registration.command.js';
import { OrgRegistrationQueryService } from './usecases/org-registration/org-registration.query.js';
import { OrgRegistrationPublicController } from './controllers/org-registration-public.controller.js';
import { OrgRegistrationAdminController } from './controllers/org-registration-admin.controller.js';
import {
  buildOrgRegistrationPublicRouter,
  buildOrgRegistrationAdminRouter,
} from './routes/org-registration.routes.js';

export const createRegistrationModule = () => {
  const applicationRepository = new OrgRegistrationApplicationRepository();
  const businessTypeRepository = new BusinessTypeRepository();

  const orgRegistrationService = new OrgRegistrationService({
    applicationRepository,
    businessTypeRepository,
  });

  const orgRegistrationCommandService = new OrgRegistrationCommandService({
    orgRegistrationService,
  });
  const orgRegistrationQueryService = new OrgRegistrationQueryService({
    orgRegistrationService,
    applicationRepository,
  });

  const publicController = new OrgRegistrationPublicController({
    orgRegistrationCommandService,
    orgRegistrationQueryService,
  });
  const adminController = new OrgRegistrationAdminController({
    orgRegistrationCommandService,
    orgRegistrationQueryService,
  });

  const router = createAsyncRouter();
  router.use(
    '/',
    buildOrgRegistrationPublicRouter({ publicController }),
  );
  router.use(
    '/admin',
    buildOrgRegistrationAdminRouter({ adminController }),
  );

  return Object.freeze({ router });
};
