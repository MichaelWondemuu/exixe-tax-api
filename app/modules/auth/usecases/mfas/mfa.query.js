import { Op } from 'sequelize';
import { HttpError } from '../../../../shared/utils/http-error.js';
import { models } from '../../../../shared/db/data-source.js';

export class MfaQueryService {
  constructor({ mfaRepository, otpCodeRepository, userRepository }) {
    this.mfaRepository = mfaRepository;
    this.otpCodeRepository = otpCodeRepository;
    this.userRepository = userRepository;
  }

  getMfaSettings = async (req) => {
    const userId = req.user.userId;
    const mfaSettings = await this.mfaRepository.getMfaSettings(req, userId);

    if (!mfaSettings) {
      return {
        smsOtpEnabled: false,
        totpEnabled: false,
        mfaEnabledOrganizationIds: [],
        mfaEnabledOrganizations: [],
        isTotpVerified: false,
      };
    }

    const orgIds = mfaSettings.mfaEnabledOrganizationIds;
    const mfaEnabledOrganizationIds = Array.isArray(orgIds) ? [...orgIds] : [];
    // TOTP is verified/configured when user completed setup (enabled and has secret)
    const isTotpVerified = !!(
      mfaSettings.totpSecret
    );

    // Fetch organization names for MFA-enabled orgs (id + name)
    let mfaEnabledOrganizations = [];
    if (mfaEnabledOrganizationIds.length > 0) {
      const idList = mfaEnabledOrganizationIds.map((id) => String(id));
      const orgs = await models.Organization.findAll({
        where: { id: { [Op.in]: idList } },
        attributes: ['id', 'name'],
      });
      const byId = new Map(orgs.map((o) => [String(o.id), { id: o.id, name: o.name }]));
      mfaEnabledOrganizations = idList.map((id) => byId.get(id) || { id, name: null });
    }

    return {
      smsOtpEnabled: mfaSettings.smsOtpEnabled,
      totpEnabled: mfaSettings.totpEnabled,
      mfaEnabledOrganizationIds,
      mfaEnabledOrganizations,
      isTotpVerified,
    };
  };

  checkMfaStatus = async (req, userId) => {
    const organizationId =
      req.organizationId ||
      req.user?.organization?.id ||
      req.user?.organizationId;
    const mfaSettings = await this.mfaRepository.getMfaSettings(req, userId);
    const enabledMethods = await this.mfaRepository.getEnabledMfaMethods(
      req,
      userId
    );

    const hasAnyMethod = enabledMethods.length > 0;
    const orgIds = mfaSettings?.mfaEnabledOrganizationIds;
    const idsArray = Array.isArray(orgIds) ? orgIds : [];
    const orgIdStr = organizationId != null ? String(organizationId) : null;

    let mfaEnabled;
    if (orgIdStr === null) {
      // OrganizationId is null: find by phone only – require MFA if any method enabled
      mfaEnabled = hasAnyMethod;
    } else {
      const isOrgInList = idsArray.some((id) => String(id) === orgIdStr);
      const legacyNoList = hasAnyMethod && idsArray.length === 0;
      mfaEnabled = hasAnyMethod && (isOrgInList || legacyNoList);
    }

    return {
      mfaEnabled,
      enabledMethods: mfaEnabled ? enabledMethods : [],
      smsOtpEnabled: mfaSettings?.smsOtpEnabled || false,
      totpEnabled: mfaSettings?.totpEnabled || false,
      mfaEnabledOrganizationIds: idsArray,
    };
  };
}
