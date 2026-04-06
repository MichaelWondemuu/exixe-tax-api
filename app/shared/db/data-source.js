import { sequelize } from './database.js';

// Auth models
import { TokenRevocation } from '../../modules/auth/persistences/token-revocation.model.js';
import { OtpSendCooldown } from '../../modules/auth/persistences/otp-send-cooldown.model.js';
import { User } from '../../modules/auth/persistences/user.model.js';
import { Role } from '../../modules/auth/persistences/role.model.js';
import { Permission } from '../../modules/auth/persistences/permission.model.js';
import { Resource } from '../../modules/auth/persistences/resource.model.js';
import { resourcePermission } from '../../modules/auth/persistences/resource-permission.model.js';
import { Organization } from '../../modules/auth/persistences/organization.model.js';
import { OrganizationDetail } from '../../modules/auth/persistences/organization-detail.model.js';
import { OrganizationWallet } from '../../modules/auth/persistences/organization-wallet.model.js';
import { UserMfaSettings } from '../../modules/auth/persistences/user-mfa-settings.model.js';
import { OtpCode } from '../../modules/auth/persistences/otp-code.model.js';
import { LoginBan } from '../../modules/auth/persistences/login-ban.model.js';

// Audit models
import { AuditLog } from '../../modules/audit/model/audit-log.model.js';

// Lookup models
import {
  Region,
  Zone,
  Woreda,
} from '../../modules/lookup/persistences/cities.model.js';
import { Sector } from '../../modules/lookup/persistences/sector.model.js';
import { VerificationBody } from '../../modules/lookup/persistences/verification-body.model.js';
import { LicensingAuthority } from '../../modules/lookup/persistences/licensing-authority.model.js';
import { BusinessType } from '../../modules/lookup/persistences/business-type.model.js';
import { Category } from '../../modules/lookup/persistences/category.model.js';
import { ProductType } from '../../modules/lookup/persistences/product-type.model.js';
import { Measurement } from '../../modules/lookup/persistences/measurement.model.js';
import { OrgRegistrationApplication } from '../../modules/registration/persistences/org-registration-application.model.js';

// Initialize all models
export const TokenRevocationModel = TokenRevocation(sequelize);
export const OtpSendCooldownModel = OtpSendCooldown(sequelize);
export const UserModel = User(sequelize);
export const RoleModel = Role(sequelize);
export const PermissionModel = Permission(sequelize);
export const ResourceModel = Resource(sequelize);
export const ResourcePermissionModel = resourcePermission(sequelize);
export const OrganizationModel = Organization(sequelize);
export const OrganizationDetailModel = OrganizationDetail(sequelize);
export const OrganizationWalletModel = OrganizationWallet(sequelize);
export const UserMfaSettingsModel = UserMfaSettings(sequelize);
export const OtpCodeModel = OtpCode(sequelize);
export const LoginBanModel = LoginBan(sequelize);

export const AuditLogModel = AuditLog(sequelize);

export const RegionModel = Region(sequelize);
export const ZoneModel = Zone(sequelize);
export const WoredaModel = Woreda(sequelize);
export const VerificationBodyModel = VerificationBody(sequelize);
export const LicensingAuthorityModel = LicensingAuthority(sequelize);
export const SectorModel = Sector(sequelize);
export const BusinessTypeModel = BusinessType(sequelize);
export const CategoryModel = Category(sequelize);
export const ProductTypeModel = ProductType(sequelize);
export const MeasurementModel = Measurement(sequelize);
export const OrgRegistrationApplicationModel =
  OrgRegistrationApplication(sequelize);

export const models = {
  TokenRevocation: TokenRevocationModel,
  OtpSendCooldown: OtpSendCooldownModel,
  User: UserModel,
  Role: RoleModel,
  Permission: PermissionModel,
  Resource: ResourceModel,
  resourcePermission: ResourcePermissionModel,
  Organization: OrganizationModel,
  OrganizationDetail: OrganizationDetailModel,
  OrganizationWallet: OrganizationWalletModel,
  UserMfaSettings: UserMfaSettingsModel,
  OtpCode: OtpCodeModel,
  LoginBan: LoginBanModel,
  AuditLog: AuditLogModel,
  Region: RegionModel,
  Zone: ZoneModel,
  Woreda: WoredaModel,
  VerificationBody: VerificationBodyModel,
  LicensingAuthority: LicensingAuthorityModel,
  Sector: SectorModel,
  BusinessType: BusinessTypeModel,
  Category: CategoryModel,
  ProductType: ProductTypeModel,
  Measurement: MeasurementModel,
  OrgRegistrationApplication: OrgRegistrationApplicationModel,
};

Object.values(models).forEach((model) => {
  if (model.associate) {
    model.associate(models);
  }
});

export const UserRole = sequelize.models.UserRole;
export const RoleResourcePermission = sequelize.models.RoleResourcePermission;
export const SisterOrganization = sequelize.models.SisterOrganization;

models.UserRole = UserRole;
models.RoleResourcePermission = RoleResourcePermission;
models.SisterOrganization = SisterOrganization;

export { sequelize, sequelize as AppDataSource };
