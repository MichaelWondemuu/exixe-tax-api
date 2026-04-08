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
import { Product } from '../../modules/product/persistences/product.model.js';
import { ProductVariant } from '../../modules/product/persistences/product-variant.model.js';
import { ProductVariantAttribute } from '../../modules/product/persistences/product-variant-attribute.model.js';
import { OrganizationProduct } from '../../modules/product/persistences/organization-product.model.js';
import { OrganizationProductVariant } from '../../modules/product/persistences/organization-product-variant.model.js';
import { OrganizationProductVariantAttribute } from '../../modules/product/persistences/organization-product-variant-attribute.model.js';
import { ExciseFacility } from '../../modules/excise/persistences/facility.model.js';
import { ExciseDeliveryNote } from '../../modules/excise/persistences/delivery-note.model.js';
import { ExciseStampRequest } from '../../modules/excise/persistences/stamp-request.model.js';
import { ExciseStampForecast } from '../../modules/excise/persistences/forecast.model.js';
import { ExciseStampStockEvent } from '../../modules/excise/persistences/stamp-stock-event.model.js';
import { ExciseStampVerification } from '../../modules/excise/persistences/stamp-verification.model.js';
import { OrgRegistrationApplication } from '../../modules/registration/persistences/org-registration-application.model.js';
import { SelfRegAddress } from '../../modules/registration/persistences/self-reg/self-reg-address.model.js';
import { SelfRegOrganization } from '../../modules/registration/persistences/self-reg/self-reg-organization.model.js';
import { SelfRegOrganizationAddress } from '../../modules/registration/persistences/self-reg/self-reg-organization-address.model.js';
import { SelfRegContact } from '../../modules/registration/persistences/self-reg/self-reg-contact.model.js';
import { SelfRegFacility } from '../../modules/registration/persistences/self-reg/self-reg-facility.model.js';
import { SelfRegLicense } from '../../modules/registration/persistences/self-reg/self-reg-license.model.js';
import { SelfRegAttachment } from '../../modules/registration/persistences/self-reg/self-reg-attachment.model.js';
import { SelfRegStandard } from '../../modules/registration/persistences/self-reg/self-reg-standard.model.js';
import { OrgRegistrationApprovalLog } from '../../modules/registration/persistences/self-reg/org-registration-approval-log.model.js';
import { Predeclaration } from '../../modules/predeclaration/persistences/predeclaration.model.js';
import { PredeclarationItem } from '../../modules/predeclaration/persistences/predeclaration-item.model.js';

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
export const ProductModel = Product(sequelize);
export const ProductVariantModel = ProductVariant(sequelize);
export const ProductVariantAttributeModel = ProductVariantAttribute(sequelize);
export const OrganizationProductModel = OrganizationProduct(sequelize);
export const OrganizationProductVariantModel =
  OrganizationProductVariant(sequelize);
export const OrganizationProductVariantAttributeModel =
  OrganizationProductVariantAttribute(sequelize);
export const ExciseFacilityModel = ExciseFacility(sequelize);
export const ExciseDeliveryNoteModel = ExciseDeliveryNote(sequelize);
export const ExciseStampRequestModel = ExciseStampRequest(sequelize);
export const ExciseStampForecastModel = ExciseStampForecast(sequelize);
export const ExciseStampStockEventModel = ExciseStampStockEvent(sequelize);
export const ExciseStampVerificationModel = ExciseStampVerification(sequelize);
export const OrgRegistrationApplicationModel =
  OrgRegistrationApplication(sequelize);
export const SelfRegAddressModel = SelfRegAddress(sequelize);
export const SelfRegOrganizationModel = SelfRegOrganization(sequelize);
export const SelfRegOrganizationAddressModel =
  SelfRegOrganizationAddress(sequelize);
export const SelfRegContactModel = SelfRegContact(sequelize);
export const SelfRegFacilityModel = SelfRegFacility(sequelize);
export const SelfRegLicenseModel = SelfRegLicense(sequelize);
export const SelfRegAttachmentModel = SelfRegAttachment(sequelize);
export const SelfRegStandardModel = SelfRegStandard(sequelize);
export const OrgRegistrationApprovalLogModel =
  OrgRegistrationApprovalLog(sequelize);
export const PredeclarationModel = Predeclaration(sequelize);
export const PredeclarationItemModel = PredeclarationItem(sequelize);

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
  Product: ProductModel,
  ProductVariant: ProductVariantModel,
  ProductVariantAttribute: ProductVariantAttributeModel,
  OrganizationProduct: OrganizationProductModel,
  OrganizationProductVariant: OrganizationProductVariantModel,
  OrganizationProductVariantAttribute: OrganizationProductVariantAttributeModel,
  ExciseFacility: ExciseFacilityModel,
  ExciseDeliveryNote: ExciseDeliveryNoteModel,
  ExciseStampRequest: ExciseStampRequestModel,
  ExciseStampForecast: ExciseStampForecastModel,
  ExciseStampStockEvent: ExciseStampStockEventModel,
  ExciseStampVerification: ExciseStampVerificationModel,
  OrgRegistrationApplication: OrgRegistrationApplicationModel,
  SelfRegAddress: SelfRegAddressModel,
  SelfRegOrganization: SelfRegOrganizationModel,
  SelfRegOrganizationAddress: SelfRegOrganizationAddressModel,
  SelfRegContact: SelfRegContactModel,
  SelfRegFacility: SelfRegFacilityModel,
  SelfRegLicense: SelfRegLicenseModel,
  SelfRegAttachment: SelfRegAttachmentModel,
  SelfRegStandard: SelfRegStandardModel,
  OrgRegistrationApprovalLog: OrgRegistrationApprovalLogModel,
  Predeclaration: PredeclarationModel,
  PredeclarationItem: PredeclarationItemModel,
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
