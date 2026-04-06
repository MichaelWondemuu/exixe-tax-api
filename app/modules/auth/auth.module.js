import { RoleRepository } from './repository/role.repository.js';
import { UserRepository } from './repository/user.repository.js';
import { OrganizationRepository } from './repository/organization.repository.js';
import { PermissionRepository } from './repository/permission.repository.js';
import { ResourceRepository } from './repository/resource.repository.js';
import { ResourcePermissionRepository } from './repository/resource-permission.repository.js';

import { AuthService } from './usecases/auths/auth.service.js';
import { AuthQueryService } from './usecases/auths/auth.query.js';
import { AuthCommandService } from './usecases/auths/auth.command.js';
import { RoleQueryService } from './usecases/roles/role.query.js';
import { RoleCommandService } from './usecases/roles/role.command.js';
import { UserService } from './usecases/users/user.service.js';
import { UserQueryService } from './usecases/users/user.query.js';
import { UserCommandService } from './usecases/users/user.command.js';
import { OrganizationCommandService } from './usecases/organizations/organization.command.js';
import { OrganizationQueryService } from './usecases/organizations/organization.query.js';
import { PermissionQueryService } from './usecases/permissions/permission.query.js';
import { PermissionCommandService } from './usecases/permissions/permission.command.js';
import { ResourceQueryService } from './usecases/resources/resource.query.js';
import { ResourceCommandService } from './usecases/resources/resource.command.js';
import { ResourcePermissionQueryService } from './usecases/resources/resource-permission.query.js';
import { ResourcePermissionCommandService } from './usecases/resources/resource-permission.command.js';
import { PinAuthService } from './usecases/auths/pin-auth.service.js';
import { PinAuthCommandService } from './usecases/auths/pin-auth.command.js';
import { MfaService } from './usecases/mfas/mfa.service.js';
import { SystemReportService } from './usecases/system-reports/system-report.service.js';
import { SystemReportQueryService } from './usecases/system-reports/system-report.query.js';

import { AuthController } from './controllers/auth.controller.js';
import { UserController } from './controllers/user.controller.js';
import { RoleController } from './controllers/role.controller.js';
import { OrganizationController } from './controllers/organization.controller.js';
import { PermissionController } from './controllers/permission.controller.js';
import { ResourceController } from './controllers/resource.controller.js';
import { ResourcePermissionController } from './controllers/resource-permission.controller.js';
import { PinAuthController } from './controllers/pin-auth.controller.js';
import { MfaController } from './controllers/mfa.controller.js';
import { SystemReportController } from './controllers/system-report.controller.js';

import { buildAuthRouter } from './routes/auth.routes.js';
import { buildUserRouter } from './routes/user.routes.js';
import { buildRoleRouter } from './routes/role.routes.js';
import { buildOrganizationRouter } from './routes/organization.routes.js';
import { buildSystemRouter } from './routes/system.routes.js';
import { buildPermissionRouter } from './routes/permission.routes.js';
import { buildResourceRouter } from './routes/resource.routes.js';
import { buildResourcePermissionRouter } from './routes/resource-permission.routes.js';
import { buildPinAuthRouter } from './routes/pin-auth.routes.js';
import mfaRoutes from './routes/mfa.routes.js';
import {
  MfaRepository,
  OtpCodeRepository,
} from './repository/mfa.repository.js';

import { initJWT } from './middleware/jwt.js';
import { initPinEncryption } from './utils/pin-encryption.util.js';
import { createAsyncRouter } from '../../shared/middleware/exception.handler.js';

export const createAuthModule = () => {
  // Initialize JWT (lazy initialization - only logs warning if not configured)
  // Will throw error when actually used if not configured
  initJWT(false);

  // Initialize PIN encryption (generates keys if not provided in env)
  initPinEncryption(false);

  // Initialize repositories
  const roleRepository = new RoleRepository();
  const userRepository = new UserRepository();
  const organizationRepository = new OrganizationRepository();
  const permissionRepository = new PermissionRepository();
  const resourceRepository = new ResourceRepository();
  const resourcePermissionRepository = new ResourcePermissionRepository();

  // Initialize MFA repositories and service first (needed for auth service)
  const mfaRepository = new MfaRepository();
  const otpCodeRepository = new OtpCodeRepository();
  const mfaService = new MfaService({
    mfaRepository,
    otpCodeRepository,
    userRepository,
  });

  // Initialize services
  const authService = new AuthService({
    userRepository,
    mfaService, // Inject MFA service
  });
  const authQueryService = new AuthQueryService({ authService });
  const authCommandService = new AuthCommandService({ authService });
  const roleQueryService = new RoleQueryService({ roleRepository });
  const roleCommandService = new RoleCommandService({
    roleRepository,
    roleQueryService,
  });
  const userService = new UserService({ userRepository });
  const userQueryService = new UserQueryService({ userService });
  const userCommandService = new UserCommandService({ userService });
  const organizationCommandService = new OrganizationCommandService({
    organizationRepository,
    userRepository,
    roleRepository,
  });
  const organizationQueryService = new OrganizationQueryService({
    organizationService: organizationCommandService,
  });
  const permissionQueryService = new PermissionQueryService({
    permissionRepository,
  });
  const permissionCommandService = new PermissionCommandService({
    permissionRepository,
  });
  const resourceQueryService = new ResourceQueryService({ resourceRepository });
  const resourceCommandService = new ResourceCommandService({
    resourceRepository,
    permissionRepository,
  });
  const resourcePermissionQueryService = new ResourcePermissionQueryService({
    resourcePermissionRepository,
  });
  const resourcePermissionCommandService = new ResourcePermissionCommandService(
    {
      resourcePermissionRepository,
    },
  );
  const pinAuthService = new PinAuthService({
    userRepository,
  });
  const pinAuthCommandService = new PinAuthCommandService({
    pinAuthService,
  });
  const systemReportService = new SystemReportService();
  const systemReportQueryService = new SystemReportQueryService({
    systemReportService,
  });

  // Initialize controllers
  const authController = new AuthController({
    authQueryService,
    authCommandService,
  });
  const userController = new UserController({
    userQueryService,
    userCommandService,
  });
  const roleController = new RoleController({
    roleQueryService,
    roleCommandService,
  });
  const organizationController = new OrganizationController({
    organizationQueryService,
    organizationCommandService,
  });
  const permissionController = new PermissionController({
    permissionQueryService,
    permissionCommandService,
  });
  const resourceController = new ResourceController({
    resourceQueryService,
    resourceCommandService,
  });
  const resourcePermissionController = new ResourcePermissionController({
    resourcePermissionQueryService,
    resourcePermissionCommandService,
  });
  const pinAuthController = new PinAuthController({
    pinAuthCommandService,
  });
  const systemReportController = new SystemReportController({
    systemReportQueryService,
  });

  // Build all routers
  const mainRouter = createAsyncRouter();
  mainRouter.use('/', buildAuthRouter({ controller: authController }));
  mainRouter.use('/users', buildUserRouter({ controller: userController }));
  mainRouter.use('/roles', buildRoleRouter({ controller: roleController }));
  mainRouter.use(
    '/organizations',
    buildOrganizationRouter({ controller: organizationController }),
  );
  mainRouter.use(
    '/permissions',
    buildPermissionRouter({ controller: permissionController }),
  );
  mainRouter.use(
    '/resources',
    buildResourceRouter({ controller: resourceController }),
  );
  mainRouter.use(
    '/resource-permissions',
    buildResourcePermissionRouter({ controller: resourcePermissionController }),
  );
  mainRouter.use(
    '/pin-auth',
    buildPinAuthRouter({ controller: pinAuthController }),
  );
  mainRouter.use('/mfa', mfaRoutes);

  // System routes (require system user)
  mainRouter.use(
    '/system',
    buildSystemRouter({
      authController,
      organizationController,
      roleController,
      resourceController,
      systemReportController,
    }),
  );

  return Object.freeze({
    router: mainRouter,
  });
};
