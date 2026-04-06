function mfaOrganizationBrief(org) {
  if (!org) return org;
  return {
    id: org.id,
    name: org.name != null ? org.name : null,
  };
}

export class MfaResponse {
  static toSettings(settings) {
    if (!settings) return settings;
    return {
      smsOtpEnabled: !!settings.smsOtpEnabled,
      totpEnabled: !!settings.totpEnabled,
      mfaEnabledOrganizationIds: Array.isArray(settings.mfaEnabledOrganizationIds)
        ? [...settings.mfaEnabledOrganizationIds]
        : [],
      mfaEnabledOrganizations: Array.isArray(settings.mfaEnabledOrganizations)
        ? settings.mfaEnabledOrganizations.map(mfaOrganizationBrief)
        : [],
      isTotpVerified: !!settings.isTotpVerified,
    };
  }

  static toStatus(status) {
    if (!status) return status;
    return {
      mfaEnabled: !!status.mfaEnabled,
      enabledMethods: Array.isArray(status.enabledMethods)
        ? [...status.enabledMethods]
        : [],
      smsOtpEnabled: !!status.smsOtpEnabled,
      totpEnabled: !!status.totpEnabled,
      mfaEnabledOrganizationIds: Array.isArray(status.mfaEnabledOrganizationIds)
        ? [...status.mfaEnabledOrganizationIds]
        : [],
    };
  }

  static toSmsOtpToggle(payload) {
    if (!payload) return payload;
    return {
      message: payload.message,
      smsOtpEnabled: !!payload.smsOtpEnabled,
    };
  }

  static toTotpInitiate(payload) {
    if (!payload) return payload;
    return {
      message: payload.message,
      secret: payload.secret,
      qrCode: payload.qrCode,
      otpauthUrl: payload.otpauthUrl,
      isReSetup: !!payload.isReSetup,
    };
  }

  static toTotpVerified(payload) {
    if (!payload) return payload;
    const out = {
      message: payload.message,
      totpEnabled: !!payload.totpEnabled,
      isReSetup: !!payload.isReSetup,
    };
    if (Array.isArray(payload.backupCodes)) {
      out.backupCodes = [...payload.backupCodes];
    }
    return out;
  }

  static toTotpDisabled(payload) {
    if (!payload) return payload;
    return {
      message: payload.message,
      totpEnabled: !!payload.totpEnabled,
    };
  }

  static toTotpToggle(payload) {
    if (!payload) return payload;
    return {
      message: payload.message,
      totpEnabled: !!payload.totpEnabled,
    };
  }

  static toSendSmsOtp(payload) {
    if (!payload) return payload;
    return {
      message: payload.message,
      expiresInMinutes: payload.expiresInMinutes,
    };
  }

  static toVerifyOtp(payload) {
    if (!payload) return payload;
    return {
      message: payload.message,
      verified: !!payload.verified,
    };
  }

  static toVerifyTotp(payload) {
    if (!payload) return payload;
    const out = {
      message: payload.message,
      verified: !!payload.verified,
      method: payload.method,
    };
    if (typeof payload.remainingBackupCodes === 'number') {
      out.remainingBackupCodes = payload.remainingBackupCodes;
    }
    return out;
  }

  static toOrganizationMfaList(payload) {
    if (!payload) return payload;
    return {
      message: payload.message,
      mfaEnabledOrganizationIds: Array.isArray(payload.mfaEnabledOrganizationIds)
        ? [...payload.mfaEnabledOrganizationIds]
        : [],
    };
  }
}
