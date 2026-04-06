/**
 * Helpers for user scope (system organization): level, scopeId, and scope-not-broader-than-admin validation.
 * Scope hierarchy (broadest to strictest): COUNTRY > REGION > ZONE > WOREDA > ORGANIZATION. SECTOR is a filter dimension.
 */

const SYSTEM_TENANT_ID = 'system-tenant';

/** Scope level rank: higher = broader. New user scope rank must be <= admin rank (stricter or equal). */
const SCOPE_RANK = {
  ORGANIZATION: 0,
  WOREDA: 1,
  ZONE: 2,
  REGION: 3,
  COUNTRY: 4,
  SECTOR: 1, // same granularity as WOREDA for "not broader" comparison
};

export function getSystemTenantId() {
  return SYSTEM_TENANT_ID;
}

export function isSystemOrganization(organization) {
  if (!organization) return false;
  const tenantId = organization.tenantId ?? organization.tenant_id;
  return tenantId === SYSTEM_TENANT_ID;
}

export function getScopeRank(scopeLevel) {
  if (!scopeLevel) return SCOPE_RANK.ORGANIZATION;
  return SCOPE_RANK[String(scopeLevel).toUpperCase()] ?? SCOPE_RANK.ORGANIZATION;
}

/**
 * Check whether the new scope is strictly not broader than the admin's scope.
 * Same level: scopeId must match. Stricter level: new scope must be contained in admin's (e.g. zone under region).
 * @param {Object} models - Sequelize models
 * @param {Object} adminUser - Admin user with scopeLevel, scopeId
 * @param {string} newScopeLevel
 * @param {string|null} newScopeId
 * @param {string[]|null} newScopeSectorIds
 * @returns {Promise<{ allowed: boolean, message?: string }>}
 */
export async function validateNewScopeNotBroaderThanAdmin(
  models,
  adminUser,
  newScopeLevel,
  newScopeId,
  newScopeSectorIds
) {
  const adminLevel = (adminUser.scopeLevel || 'ORGANIZATION').toUpperCase();
  const adminId = adminUser.scopeId != null ? String(adminUser.scopeId) : null;
  const newLevel = (newScopeLevel || 'ORGANIZATION').toUpperCase();
  const newId = newScopeId != null && newScopeId !== '' ? String(newScopeId) : null;

  const adminRank = getScopeRank(adminLevel);
  const newRank = getScopeRank(newLevel);

  // New scope must be same or stricter (lower rank)
  if (newRank > adminRank) {
    return {
      allowed: false,
      message: `Scope level ${newLevel} is broader than your scope (${adminLevel}). You may only create users with the same or stricter scope.`,
    };
  }

  // Same level: scopeId must match (except ORGANIZATION)
  if (newRank === adminRank && newLevel !== 'ORGANIZATION') {
    if (adminId !== newId) {
      return {
        allowed: false,
        message: `Scope level ${newLevel} requires the same scopeId as your scope.`,
      };
    }
    return { allowed: true };
  }

  // New scope is stricter: validate containment (e.g. zone under region, woreda under zone)
  if (newLevel === 'ZONE' && adminLevel === 'REGION' && adminId && newId) {
    const zone = await models.Zone?.findByPk(Number(newId), { attributes: ['id', 'region_id'] });
    if (!zone) {
      return { allowed: false, message: 'Invalid zone for scope.' };
    }
    const zoneRegionId = zone.region_id ?? zone.regionId;
    if (String(zoneRegionId) !== String(adminId)) {
      return {
        allowed: false,
        message: 'Selected zone is not under your region.',
      };
    }
    return { allowed: true };
  }

  if (newLevel === 'WOREDA' && adminLevel === 'ZONE' && adminId && newId) {
    const woreda = await models.Woreda?.findByPk(Number(newId), { attributes: ['id', 'zone_id'] });
    if (!woreda) {
      return { allowed: false, message: 'Invalid woreda for scope.' };
    }
    const woredaZoneId = woreda.zone_id ?? woreda.zoneId;
    if (String(woredaZoneId) !== String(adminId)) {
      return {
        allowed: false,
        message: 'Selected woreda is not under your zone.',
      };
    }
    return { allowed: true };
  }

  if (newLevel === 'WOREDA' && adminLevel === 'REGION' && adminId && newId) {
    const woreda = await models.Woreda?.findByPk(Number(newId), {
      attributes: ['id', 'zone_id'],
      include: [{ model: models.Zone, as: 'zone', required: false, attributes: ['region_id'] }],
    });
    if (!woreda) {
      return { allowed: false, message: 'Invalid woreda for scope.' };
    }
    const zone = woreda.zone || (woreda.zone_id ? await models.Zone?.findByPk(woreda.zone_id) : null);
    if (!zone || String(zone.region_id ?? zone.regionId) !== String(adminId)) {
      return { allowed: false, message: 'Selected woreda is not under your region.' };
    }
    return { allowed: true };
  }

  // ORGANIZATION or COUNTRY/REGION with no containment to check
  return { allowed: true };
}

/**
 * Check if the current user is an admin of the System organization (can create users with scope not broader than their own).
 */
export function isSystemOrgAdmin(req) {
  const user = req?.user;
  if (!user) return false;
  const hasAdminRole = Array.isArray(user.roles)
    ? user.roles.some((r) => (r?.name || r) === 'admin')
    : false;
  const orgId = user.organization?.id ?? user.organizationId;
  if (!orgId) return false;
  return hasAdminRole; // Caller must also verify org is system org by loading it
}
