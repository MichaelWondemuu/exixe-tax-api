import { Model } from 'sequelize';
import { HttpError } from '../../../../shared/utils/http-error.js';
import { PhoneUtil } from '../../../../shared/utils/phone.util.js';
import { createCentralAuthService } from '../auths/central-auth.service.js';
import {
  isSystemOrganization,
  validateNewScopeNotBroaderThanAdmin,
} from '../../utils/scope-helper.js';
import { logger } from '../../../../shared/logger/logger.js';
import {
  OrganizationDetailResponse,
  OrganizationResponse,
} from './organization.response.js';
import { UserResponse } from '../users/user.response.js';

function mapOrganizationCommandPayload(result) {
  if (!result || typeof result !== 'object') return result;
  if (
    !Object.prototype.hasOwnProperty.call(result, 'data') ||
    result.data == null
  ) {
    return result;
  }
  return {
    ...result,
    data: OrganizationResponse.toResponse(result.data),
  };
}

function mapOrganizationDetailCommandPayload(result) {
  if (!result || typeof result !== 'object') return result;
  if (
    !Object.prototype.hasOwnProperty.call(result, 'data') ||
    result.data == null
  ) {
    return result;
  }
  return {
    ...result,
    data: OrganizationDetailResponse.toResponse(result.data),
  };
}

function mapUserInOrgCommandPayload(result) {
  if (!result || typeof result !== 'object') return result;
  if (
    !Object.prototype.hasOwnProperty.call(result, 'data') ||
    result.data == null
  ) {
    return result;
  }
  return {
    ...result,
    data: UserResponse.toResponse(result.data),
  };
}

/** Build flat object for OrganizationDetail from request data (camelCase). */
function buildDetailPayload(data) {
  const get = (...keys) => keys.reduce((v, k) => v ?? data[k], undefined);
  const out = {};
  const city = get('city', 'sellerCity');
  if (city != null) out.city = city;
  const email = get('email', 'sellerEmail');
  if (email != null) out.email = email;
  const houseNumber = get('houseNumber', 'sellerHouseNumber');
  if (houseNumber != null) out.houseNumber = houseNumber;
  const legalName = get('legalName', 'sellerLegalName');
  if (legalName != null) out.legalName = legalName;
  const locality = get('locality', 'sellerLocality');
  if (locality != null) out.locality = locality;
  const phone = get('phone', 'sellerPhone');
  if (phone != null) out.phone = phone;
  const region = get('region', 'sellerRegion');
  if (region != null) out.region = region;
  const subCity = get('subCity', 'sellerSubCity');
  if (subCity != null) out.subCity = subCity;
  const tin = get('tin', 'sellerTin');
  if (tin != null) out.tin = tin;
  const vatNumber = get('vatNumber', 'sellerVatNumber');
  if (vatNumber != null) out.vatNumber = vatNumber;
  const wereda = get('wereda', 'sellerWereda');
  if (wereda != null) out.wereda = wereda;
  const country = get('country', 'einvoiceCountry');
  if (country != null) out.country = country;
  const serialNumber = get('serialNumber', 'einvoiceSerialNumber');
  if (serialNumber != null) out.serialNumber = serialNumber;
  const systemNumber = get('systemNumber');
  if (systemNumber != null) out.systemNumber = systemNumber;
  const systemType = get('systemType');
  if (systemType != null) out.systemType = systemType;
  const lastInvoiceCounter = get('lastInvoiceCounter');
  if (lastInvoiceCounter != null) out.lastInvoiceCounter = lastInvoiceCounter;
  const lastInvoiceRef = get('lastInvoiceReferenceNumber');
  if (lastInvoiceRef != null) out.lastInvoiceReferenceNumber = lastInvoiceRef;
  const lastReceiptRef = get('lastReceiptReferenceNumber');
  if (lastReceiptRef != null) out.lastReceiptReferenceNumber = lastReceiptRef;
  return out;
}

/** Optional lookup associations when Region/Zone/Woreda/Sector models are registered. */
function organizationGeoIncludes(models) {
  const inc = [];
  if (models.Region) {
    inc.push({ model: models.Region, as: 'region', required: false });
  }
  if (models.Zone) {
    inc.push({ model: models.Zone, as: 'zone', required: false });
  }
  if (models.Woreda) {
    inc.push({ model: models.Woreda, as: 'woreda', required: false });
  }
  if (models.Sector) {
    inc.push({ model: models.Sector, as: 'sector', required: false });
  }
  return inc;
}

export class OrganizationService {
  constructor({
    organizationRepository,
    userRepository,
    roleRepository,
  }) {
    this.organizationRepository = organizationRepository;
    this.userRepository = userRepository;
    this.roleRepository = roleRepository;
    this.centralAuth = createCentralAuthService();
  }

  listOrganizations = async (req, queryParams) => {
    const { models } = await import('../../../../shared/db/data-source.js');
    const options = {
      include: [
        { model: models.OrganizationDetail, as: 'detail', required: false },
        ...organizationGeoIncludes(models),
      ],
    };
    if (!req.user.isSystem) {
      options.where = {
        ...options.where,
        id: req.user.organization.id,
      };
    }
    return await this.organizationRepository.findAll(req, options, queryParams);
  };

  getOrganization = async (req, id) => {
    const { models } = await import('../../../../shared/db/data-source.js');
    const organization = await this.organizationRepository.findById(req, id, {
      include: [
        { model: models.OrganizationDetail, as: 'detail', required: false },
        ...organizationGeoIncludes(models),
      ],
    });
    if (!organization) {
      throw new HttpError(
        404,
        'ORGANIZATION_NOT_FOUND',
        'Organization not found',
      );
    }
    return { data: organization };
  };

  getOrganizationDetail = async (req, organizationId) => {
    const organization = await this.organizationRepository.findById(
      req,
      organizationId,
    );
    if (!organization) {
      throw new HttpError(
        404,
        'ORGANIZATION_NOT_FOUND',
        'Organization not found',
      );
    }
    const { models } = await import('../../../../shared/db/data-source.js');
    const detail = await models.OrganizationDetail.findOne({
      where: { organizationId },
    });
    return { data: detail };
  };

  async createOrganizationDetail(req, organizationId, data) {
    const organization = await this.organizationRepository.findById(
      req,
      organizationId,
    );
    if (!organization) {
      throw new HttpError(
        404,
        'ORGANIZATION_NOT_FOUND',
        'Organization not found',
      );
    }
    const { models } = await import('../../../../shared/db/data-source.js');
    const existing = await models.OrganizationDetail.findOne({
      where: { organizationId },
    });
    if (existing) {
      throw new HttpError(
        409,
        'ORGANIZATION_DETAIL_EXISTS',
        'Organization already has details; use update instead',
      );
    }
    const payload = buildDetailPayload(data);
    const detail = await models.OrganizationDetail.create({
      organizationId,
      ...payload,
    });
    return { message: 'Organization detail created', data: detail };
  }

  async updateOrganizationDetail(req, organizationId, data) {
    const organization = await this.organizationRepository.findById(
      req,
      organizationId,
    );
    if (!organization) {
      throw new HttpError(
        404,
        'ORGANIZATION_NOT_FOUND',
        'Organization not found',
      );
    }
    const { models } = await import('../../../../shared/db/data-source.js');
    let detail = await models.OrganizationDetail.findOne({
      where: { organizationId },
    });
    const payload = buildDetailPayload(data);
    if (Object.keys(payload).length === 0) {
      return {
        message: 'Organization detail updated',
        data: detail,
      };
    }
    if (detail) {
      await detail.update(payload);
    } else {
      detail = await models.OrganizationDetail.create({
        organizationId,
        ...payload,
      });
    }
    return { message: 'Organization detail updated', data: detail };
  }

  deleteOrganizationDetail = async (req, organizationId) => {
    const organization = await this.organizationRepository.findById(
      req,
      organizationId,
    );
    if (!organization) {
      throw new HttpError(
        404,
        'ORGANIZATION_NOT_FOUND',
        'Organization not found',
      );
    }
    const { models } = await import('../../../../shared/db/data-source.js');
    const deleted = await models.OrganizationDetail.destroy({
      where: { organizationId },
    });
    if (deleted === 0) {
      throw new HttpError(
        404,
        'ORGANIZATION_DETAIL_NOT_FOUND',
        'Organization has no details to delete',
      );
    }
    return { message: 'Organization detail deleted' };
  };

  /**
   * Generate einvoice.cnf file content for an organization.
   * O = root (main) organization name; OU = branch/sub-branch name when applicable.
   */
  getEinvoiceCnf = async (req, id) => {
    const { models } = await import('../../../../shared/db/data-source.js');
    const organization = await this.organizationRepository.findById(req, id);
    if (!organization) {
      throw new HttpError(
        404,
        'ORGANIZATION_NOT_FOUND',
        'Organization not found',
      );
    }
    const orgWithParent = await models.Organization.findByPk(organization.id, {
      include: [
        { model: models.Organization, as: 'parent', required: false },
        { model: models.OrganizationDetail, as: 'detail', required: false },
      ],
    });
    const org = orgWithParent || organization;
    const d = org.detail || {};

    // Resolve root (MAIN) organization name for O by walking parent chain
    let rootOrg = org;
    if (
      org.organizationType === 'BRANCH' ||
      org.organizationType === 'SUB_BRANCH'
    ) {
      let current = org;
      while (current.parentId) {
        const parent = await models.Organization.findByPk(current.parentId);
        if (!parent) break;
        current = parent;
      }
      rootOrg = current;
    }
    const O = rootOrg && rootOrg.name ? rootOrg.name : org.name;
    const OU =
      org.organizationType === 'BRANCH' || org.organizationType === 'SUB_BRANCH'
        ? org.name
        : org.name || 'main';

    const C = d.country ?? 'ET';
    const ST = d.region ?? 'Addis Ababa';
    const L = d.locality ?? 'Addis Ababa';
    const CN = d.tin ?? '';
    const serialNumberVal = d.serialNumber ?? 'SYSTEM-001';
    const emailAddress = d.email ?? '';

    const lines = [
      '[ req ]',
      'default_bits        = 2048',
      'prompt              = no',
      'default_md          = sha512',
      'distinguished_name  = dn',
      '',
      '[ dn ]',
      `C  = ${C}`,
      `ST = ${ST}`,
      `L  = ${L}`,
      `O  = ${O}`,
      `OU = ${OU}`,
      `CN = ${CN}`,
      `serialNumber = ${serialNumberVal}`,
      `emailAddress = ${emailAddress}`,
      '',
    ];
    const content = lines.join('\n');
    return { data: { content }, contentType: 'text/plain' };
  };

  async createOrganization(req, data) {
    if (!data.name) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'Name is required');
    }

    // Get models
    const { models } = await import('../../../../shared/db/data-source.js');

    // Check if tenantId is provided and already exists (if tenantId is unique)
    if (data.tenantId) {
      const existingOrg = await models.Organization.findOne({
        where: { tenantId: data.tenantId },
      });
      if (existingOrg) {
        throw new HttpError(
          409,
          'TENANT_ID_EXISTS',
          `Organization with tenantId "${data.tenantId}" already exists`,
        );
      }
    }

    // Determine organization type (default to MAIN)
    const organizationType = data.organizationType || 'MAIN';

    // Validate organization type
    const validTypes = ['MAIN', 'BRANCH', 'SUB_BRANCH', 'SISTER'];
    if (!validTypes.includes(organizationType)) {
      throw new HttpError(
        400,
        'VALIDATION_ERROR',
        `Invalid organization type. Must be one of: ${validTypes.join(', ')}`,
      );
    }

    let parentId = null;
    let sisterOrgIds = [];

    // Handle relationships based on organization type
    if (organizationType === 'BRANCH') {
      // BRANCH: parentId must be set to main organization
      if (!data.parentId) {
        throw new HttpError(
          400,
          'VALIDATION_ERROR',
          'parentId is required for BRANCH type organization',
        );
      }
      parentId = data.parentId;

      // Verify parent exists and is MAIN type
      const parent = await models.Organization.findByPk(parentId);
      if (!parent) {
        throw new HttpError(
          404,
          'PARENT_NOT_FOUND',
          'Parent organization not found',
        );
      }
      if (parent.organizationType !== 'MAIN') {
        throw new HttpError(
          400,
          'VALIDATION_ERROR',
          'BRANCH organization must have a MAIN organization as parent',
        );
      }
    } else if (organizationType === 'SUB_BRANCH') {
      // SUB_BRANCH: parentId must be set to a BRANCH organization
      if (!data.parentId) {
        throw new HttpError(
          400,
          'VALIDATION_ERROR',
          'parentId is required for SUB_BRANCH type organization',
        );
      }
      parentId = data.parentId;

      // Verify parent exists and is BRANCH type
      const parent = await models.Organization.findByPk(parentId);
      if (!parent) {
        throw new HttpError(
          404,
          'PARENT_NOT_FOUND',
          'Parent organization not found',
        );
      }
      if (parent.organizationType !== 'BRANCH') {
        throw new HttpError(
          400,
          'VALIDATION_ERROR',
          'SUB_BRANCH organization must have a BRANCH organization as parent',
        );
      }
    } else if (organizationType === 'SISTER') {
      // SISTER: no parentId, but may have sisterOrgIds
      parentId = null;
      sisterOrgIds = data.sisterOrgIds || [];

      // Validate sister organizations exist
      if (sisterOrgIds.length > 0) {
        const sisterOrgs = await models.Organization.findAll({
          where: { id: sisterOrgIds },
        });
        if (sisterOrgs.length !== sisterOrgIds.length) {
          throw new HttpError(
            404,
            'SISTER_ORG_NOT_FOUND',
            'One or more sister organizations not found',
          );
        }
      }
    } else {
      // MAIN: no parentId, no sisterOrgIds
      parentId = null;
      sisterOrgIds = [];
    }

    const country = data.country ?? 'ET';
    const regionId =
      data.regionId != null && data.regionId !== ''
        ? Number(data.regionId)
        : null;
    const zoneId =
      data.zoneId != null && data.zoneId !== '' ? Number(data.zoneId) : null;
    const woredaId =
      data.woredaId != null && data.woredaId !== ''
        ? Number(data.woredaId)
        : null;
    const latitude =
      data.latitude != null && data.latitude !== ''
        ? Number(data.latitude)
        : null;
    const longitude =
      data.longitude != null && data.longitude !== ''
        ? Number(data.longitude)
        : null;
    let sectorId =
      data.sectorId == null || data.sectorId === '' ? null : data.sectorId;
    if (sectorId && models.Sector) {
      const sector = await models.Sector.findByPk(sectorId);
      if (!sector) {
        throw new HttpError(
          404,
          'SECTOR_NOT_FOUND',
          `Sector with id ${sectorId} not found`,
        );
      }
    }
    const num = (v) => (v != null && v !== '' ? Number(v) : null);
    const str = (v) => (v != null && v !== '' ? String(v).trim() : null);

    // Create organization (basic only)
    let organization;
    try {
      organization = await this.organizationRepository.create(req, {
        name: data.name,
        tenantId: data.tenantId || null,
        isActive: data.isActive !== undefined ? data.isActive : true,
        parentId: parentId,
        organizationType: organizationType,
        country,
        regionId: Number.isNaN(regionId) ? null : regionId,
        zoneId: Number.isNaN(zoneId) ? null : zoneId,
        woredaId: Number.isNaN(woredaId) ? null : woredaId,
        latitude: latitude == null || Number.isNaN(latitude) ? null : latitude,
        longitude:
          longitude == null || Number.isNaN(longitude) ? null : longitude,
        sectorId,
        expectedDailyTxnMin: num(data.expectedDailyTxnMin),
        expectedDailyTxnMax: num(data.expectedDailyTxnMax),
        expectedAvgTicketMin: num(data.expectedAvgTicketMin),
        expectedAvgTicketMax: num(data.expectedAvgTicketMax),
        expectedOpenTime: str(data.expectedOpenTime),
        expectedCloseTime: str(data.expectedCloseTime),
        riskThresholdPercent: num(data.riskThresholdPercent),
      });
    } catch (error) {
      // Handle Sequelize validation errors
      if (error.name === 'SequelizeUniqueConstraintError') {
        if (error.errors && error.errors.some((e) => e.path === 'tenant_id')) {
          throw new HttpError(
            409,
            'TENANT_ID_EXISTS',
            `Organization with tenantId "${data.tenantId}" already exists`,
          );
        }
        throw new HttpError(
          409,
          'UNIQUE_CONSTRAINT_ERROR',
          'A record with this value already exists',
        );
      }
      if (error.name === 'SequelizeValidationError') {
        const errors = error.errors.map((e) => e.message).join(', ');
        throw new HttpError(
          400,
          'VALIDATION_ERROR',
          `Validation failed: ${errors}`,
        );
      }
      throw error;
    }

    // Create organization detail (user-editable fields)
    const detailPayload = buildDetailPayload(data);
    if (Object.keys(detailPayload).length > 0) {
      await models.OrganizationDetail.create({
        organizationId: organization.id,
        ...detailPayload,
      });
    }

    // Handle sister organization relationships (many-to-many)
    if (organizationType === 'SISTER' && sisterOrgIds.length > 0) {
      try {
        await organization.setSisterOrganizations(sisterOrgIds);
      } catch (error) {
        // If sister_organizations table doesn't exist yet, log warning but continue
        if (
          error.message &&
          (error.message.includes('sister_organizations') ||
            error.message.includes('does not exist'))
        ) {
          console.warn(
            'sister_organizations table does not exist yet. Please sync database.',
          );
        } else {
          throw error;
        }
      }
    }

    // Reload organization with relationships and detail
    let orgWithRelations;
    try {
      orgWithRelations = await models.Organization.findByPk(organization.id, {
        include: [
          { model: models.Organization, as: 'parent', required: false },
          { model: models.Organization, as: 'children', required: false },
          { model: models.OrganizationDetail, as: 'detail', required: false },
          {
            model: models.Organization,
            as: 'sisterOrganizations',
            required: false,
          },
        ],
      });
    } catch (error) {
      // If sister_organizations table doesn't exist yet, fetch without it
      if (
        error.message &&
        (error.message.includes('sister_organizations') ||
          error.message.includes('does not exist'))
      ) {
        orgWithRelations = await models.Organization.findByPk(organization.id, {
          include: [
            { model: models.Organization, as: 'parent', required: false },
            { model: models.Organization, as: 'children', required: false },
            { model: models.OrganizationDetail, as: 'detail', required: false },
          ],
        });
        if (orgWithRelations) {
          orgWithRelations.sisterOrganizations = [];
        }
      } else {
        throw error;
      }
    }

    return {
      message: 'Organization created',
      data: orgWithRelations,
    };
  }

  async updateOrganization(req, id, data) {
    const organization = await this.organizationRepository.findById(req, id);
    if (!organization) {
      throw new HttpError(
        404,
        'ORGANIZATION_NOT_FOUND',
        'Organization not found',
      );
    }

    // Get models
    const { models } = await import('../../../../shared/db/data-source.js');

    const updateData = {};
    if (data.name !== undefined) updateData.name = data.name;

    // Handle organizationType update
    if (data.organizationType !== undefined) {
      const newType = data.organizationType;
      const validTypes = ['MAIN', 'BRANCH', 'SUB_BRANCH', 'SISTER'];
      if (!validTypes.includes(newType)) {
        throw new HttpError(
          400,
          'VALIDATION_ERROR',
          `Invalid organization type. Must be one of: ${validTypes.join(', ')}`,
        );
      }
      updateData.organizationType = newType;

      // Validate relationships based on new type
      if (newType === 'BRANCH') {
        if (!data.parentId && !organization.parentId) {
          throw new HttpError(
            400,
            'VALIDATION_ERROR',
            'parentId is required for BRANCH type organization',
          );
        }
        const parentId = data.parentId || organization.parentId;
        const parent = await models.Organization.findByPk(parentId);
        if (!parent) {
          throw new HttpError(
            404,
            'PARENT_NOT_FOUND',
            'Parent organization not found',
          );
        }
        if (parent.organizationType !== 'MAIN') {
          throw new HttpError(
            400,
            'VALIDATION_ERROR',
            'BRANCH organization must have a MAIN organization as parent',
          );
        }
        updateData.parentId = parentId;
      } else if (newType === 'SUB_BRANCH') {
        if (!data.parentId && !organization.parentId) {
          throw new HttpError(
            400,
            'VALIDATION_ERROR',
            'parentId is required for SUB_BRANCH type organization',
          );
        }
        const parentId = data.parentId || organization.parentId;
        const parent = await models.Organization.findByPk(parentId);
        if (!parent) {
          throw new HttpError(
            404,
            'PARENT_NOT_FOUND',
            'Parent organization not found',
          );
        }
        if (parent.organizationType !== 'BRANCH') {
          throw new HttpError(
            400,
            'VALIDATION_ERROR',
            'SUB_BRANCH organization must have a BRANCH organization as parent',
          );
        }
        updateData.parentId = parentId;
      } else if (newType === 'SISTER') {
        updateData.parentId = null;
      } else if (newType === 'MAIN') {
        updateData.parentId = null;
      }
    }

    if (data.tenantId !== undefined) updateData.tenantId = data.tenantId;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    if (data.country !== undefined) updateData.country = data.country;
    if (data.regionId !== undefined)
      updateData.regionId =
        data.regionId == null || data.regionId === ''
          ? null
          : Number(data.regionId);
    if (data.zoneId !== undefined)
      updateData.zoneId =
        data.zoneId == null || data.zoneId === '' ? null : Number(data.zoneId);
    if (data.woredaId !== undefined)
      updateData.woredaId =
        data.woredaId == null || data.woredaId === ''
          ? null
          : Number(data.woredaId);
    if (data.latitude !== undefined)
      updateData.latitude =
        data.latitude == null || data.latitude === ''
          ? null
          : Number(data.latitude);
    if (data.longitude !== undefined)
      updateData.longitude =
        data.longitude == null || data.longitude === ''
          ? null
          : Number(data.longitude);
    if (data.sectorId !== undefined) {
      const sectorIdVal =
        data.sectorId === null || data.sectorId === '' ? null : data.sectorId;
      if (sectorIdVal && models.Sector) {
        const sector = await models.Sector.findByPk(sectorIdVal);
        if (!sector) {
          throw new HttpError(
            404,
            'SECTOR_NOT_FOUND',
            `Sector with id ${sectorIdVal} not found`,
          );
        }
      }
      updateData.sectorId = sectorIdVal;
    }

    if (data.expectedDailyTxnMin !== undefined)
      updateData.expectedDailyTxnMin =
        data.expectedDailyTxnMin == null || data.expectedDailyTxnMin === ''
          ? null
          : Number(data.expectedDailyTxnMin);
    if (data.expectedDailyTxnMax !== undefined)
      updateData.expectedDailyTxnMax =
        data.expectedDailyTxnMax == null || data.expectedDailyTxnMax === ''
          ? null
          : Number(data.expectedDailyTxnMax);
    if (data.expectedAvgTicketMin !== undefined)
      updateData.expectedAvgTicketMin =
        data.expectedAvgTicketMin == null || data.expectedAvgTicketMin === ''
          ? null
          : Number(data.expectedAvgTicketMin);
    if (data.expectedAvgTicketMax !== undefined)
      updateData.expectedAvgTicketMax =
        data.expectedAvgTicketMax == null || data.expectedAvgTicketMax === ''
          ? null
          : Number(data.expectedAvgTicketMax);
    if (data.expectedOpenTime !== undefined)
      updateData.expectedOpenTime =
        data.expectedOpenTime == null || data.expectedOpenTime === ''
          ? null
          : String(data.expectedOpenTime).trim();
    if (data.expectedCloseTime !== undefined)
      updateData.expectedCloseTime =
        data.expectedCloseTime == null || data.expectedCloseTime === ''
          ? null
          : String(data.expectedCloseTime).trim();
    if (data.riskThresholdPercent !== undefined)
      updateData.riskThresholdPercent =
        data.riskThresholdPercent == null || data.riskThresholdPercent === ''
          ? null
          : Number(data.riskThresholdPercent);

    // Handle parentId update separately (if not already handled by organizationType)
    if (data.organizationType === undefined) {
      if (data.parentId !== undefined) {
        const parentId = data.parentId;
        if (parentId === null || parentId === '') {
          updateData.parentId = null;
        } else {
          updateData.parentId = parentId;
        }
      }
    }

    const updatedOrganization = await this.organizationRepository.update(
      req,
      id,
      updateData,
    );

    // Update or create organization detail when any detail field is provided
    const detailPayload = buildDetailPayload(data);
    if (Object.keys(detailPayload).length > 0) {
      let detail = await models.OrganizationDetail.findOne({
        where: { organizationId: id },
      });
      if (detail) {
        await detail.update(detailPayload);
      } else {
        await models.OrganizationDetail.create({
          organizationId: id,
          ...detailPayload,
        });
      }
    }

    // Handle sister organization relationships if provided
    if (data.sisterOrgIds !== undefined) {
      const sisterOrgIds = data.sisterOrgIds || [];
      const orgInstance = await models.Organization.findByPk(id);
      if (orgInstance) {
        // Validate sister organizations exist
        if (sisterOrgIds.length > 0) {
          const sisterOrgs = await models.Organization.findAll({
            where: { id: sisterOrgIds },
          });
          if (sisterOrgs.length !== sisterOrgIds.length) {
            throw new HttpError(
              404,
              'SISTER_ORG_NOT_FOUND',
              'One or more sister organizations not found',
            );
          }
        }
        try {
          await orgInstance.setSisterOrganizations(sisterOrgIds);
        } catch (error) {
          // If sister_organizations table doesn't exist yet, log warning but continue
          if (error.message && error.message.includes('sister_organizations')) {
            console.warn(
              'sister_organizations table does not exist yet. Please sync database.',
            );
          } else {
            throw error;
          }
        }
      }
    }

    // Reload organization with relationships and detail
    let orgWithRelations;
    try {
      orgWithRelations = await models.Organization.findByPk(id, {
        include: [
          { model: models.Organization, as: 'parent', required: false },
          { model: models.Organization, as: 'children', required: false },
          { model: models.OrganizationDetail, as: 'detail', required: false },
          {
            model: models.Organization,
            as: 'sisterOrganizations',
            required: false,
          },
        ],
      });
    } catch (error) {
      // If sister_organizations table doesn't exist yet, fetch without it
      if (error.message && error.message.includes('sister_organizations')) {
        orgWithRelations = await models.Organization.findByPk(id, {
          include: [
            { model: models.Organization, as: 'parent', required: false },
            { model: models.Organization, as: 'children', required: false },
            { model: models.OrganizationDetail, as: 'detail', required: false },
          ],
        });
        if (orgWithRelations) {
          orgWithRelations.sisterOrganizations = [];
        }
      } else {
        throw error;
      }
    }

    return {
      message: 'Organization updated',
      data: orgWithRelations || updatedOrganization,
    };
  }

  deleteOrganization = async (req, id) => {
    const organization = await this.organizationRepository.findById(req, id);
    if (!organization) {
      throw new HttpError(
        404,
        'ORGANIZATION_NOT_FOUND',
        'Organization not found',
      );
    }

    await this.organizationRepository.delete(req, id);
    return { message: 'Organization deleted' };
  };

  listUsersInOrganization = async (req, organizationId, queryParams = {}) => {
    const organization = await this.organizationRepository.findById(
      req,
      organizationId,
    );
    if (!organization) {
      throw new HttpError(
        404,
        'ORGANIZATION_NOT_FOUND',
        'Organization not found',
      );
    }

    // Use user repository to get paginated results with proper scope filtering
    return await this.userRepository.findAll(
      req,
      {
        where: { organizationId },
        include: [
          {
            association: 'roles',
            required: false,
          },
        ],
      },
      queryParams,
    );
  };

  async createUserInOrganization(req, data) {
    if (!data.organizationId) {
      throw new HttpError(
        400,
        'VALIDATION_ERROR',
        'organizationId is required',
      );
    }

    // Verify organization exists
    const organization = await this.organizationRepository.findById(
      req,
      data.organizationId,
    );
    if (!organization) {
      throw new HttpError(
        404,
        'ORGANIZATION_NOT_FOUND',
        'Organization not found',
      );
    }

    const { models } = await import('../../../../shared/db/data-source.js');
    const targetIsSystemOrg = isSystemOrganization(organization);

    // For System organization: require scope and validate new user scope is not broader than creator's
    let scopeLevel = data.scopeLevel ?? (targetIsSystemOrg ? 'ORGANIZATION' : undefined);
    let scopeId = data.scopeId != null && data.scopeId !== '' ? String(data.scopeId) : null;
    let scopeSectorIds = null;
    if (Array.isArray(data.sectorIds) && data.sectorIds.length > 0) {
      scopeSectorIds = data.sectorIds.filter((id) => id != null && String(id).trim() !== '');
    } else if (data.scopeSectorIds != null && Array.isArray(data.scopeSectorIds)) {
      scopeSectorIds = data.scopeSectorIds.filter((id) => id != null && String(id).trim() !== '');
    }

    if (targetIsSystemOrg) {
      if (!scopeLevel) {
        throw new HttpError(400, 'VALIDATION_ERROR', 'scopeLevel is required for System organization users');
      }
      if (scopeLevel !== 'ORGANIZATION' && !scopeId) {
        throw new HttpError(
          400,
          'VALIDATION_ERROR',
          `scopeId is required when scopeLevel is ${scopeLevel}`,
        );
      }
      // Creator must be admin of System org; new user scope must not be broader than creator's
      const creatorUser = await models.User.findByPk(req.user?.userId, {
        attributes: ['id', 'organizationId', 'scopeLevel', 'scopeId', 'scopeSectorIds'],
        include: [
          { model: models.Organization, as: 'organization', required: false, attributes: ['id', 'tenantId'] },
          { model: models.Role, as: 'roles', required: false, attributes: ['name'] },
        ],
      });
      if (creatorUser && isSystemOrganization(creatorUser.organization)) {
        const isAdmin = (creatorUser.roles || []).some((r) => r.name === 'admin');
        if (isAdmin) {
          const validation = await validateNewScopeNotBroaderThanAdmin(
            models,
            creatorUser,
            scopeLevel,
            scopeId,
            scopeSectorIds,
          );
          if (!validation.allowed) {
            throw new HttpError(403, 'SCOPE_NOT_ALLOWED', validation.message);
          }
        }
      }
    }

    // If creator is system user and target is NOT System org, allow creation only when organization has no admin
    if (req.user?.isSystem && !targetIsSystemOrg) {
      const existingAdmin = await models.User.findOne({
        where: { organizationId: data.organizationId },
        include: [
          {
            model: models.Role,
            as: 'roles',
            where: { name: 'admin' },
            required: true,
          },
        ],
      });
      if (existingAdmin) {
        throw new HttpError(
          403,
          'ORGANIZATION_HAS_ADMIN',
          'Cannot create user: organization already has a user with admin role',
        );
      }
    }

    // Format and validate phone number
    let formattedPhone;
    try {
      formattedPhone = PhoneUtil.checkValidPhone(data.phone, 'ET');
    } catch (error) {
      throw new HttpError(
        400,
        'VALIDATION_ERROR',
        `Invalid phone number: ${error.message}`,
      );
    }

    const firstname = data.firstname ?? '';
    const lastname = data.lastname ?? '';
    const middlename = data.middlename ?? null;
    const password = data.password ?? data.pin;

    if (!firstname || !lastname) {
      throw new HttpError(
        400,
        'VALIDATION_ERROR',
        'firstname and lastname are required',
      );
    }

    // Check user by mobile first; if not found, require password and sign up
    try {
      const isUserExists =
        await this.centralAuth.getUserByMobile(formattedPhone);
      if (!isUserExists) {
        if (!password || !req.user?.isSystem) {
          // set random password and sign up
          const randomPassword = Math.random().toString(36).substring(2, 15);
          password = randomPassword;
        }
        const user = await this.centralAuth.signupWithPassword({
          firstname,
          lastname,
          middlename,
          mobile: formattedPhone,
          password,
        });
        logger.info(`User created in central auth: ${user}`);
      }
    } catch (err) {
      throw new HttpError(
        502,
        'CENTRAL_AUTH_ERROR',
        err.message || 'Failed to check or create central auth user',
      );
    }

    // Get admin role
    const adminRole = await models.Role.findOne({
      where: { name: 'admin', isSystem: true },
    });

    if (!adminRole) {
      throw new HttpError(500, 'ROLE_NOT_FOUND', 'Admin role not found');
    }

    // Check if user with same phone already exists in this organization
    const existingUser = await models.User.findOne({
      where: {
        phone: formattedPhone,
        organizationId: data.organizationId,
      },
    });

    if (existingUser) {
      return {
        message: 'User already exists',
        data: existingUser,
      };
    }

    try {
      const createPayload = {
        phone: formattedPhone,
        organizationId: data.organizationId,
        isSystem: data.isSystem || false,
        isActive: data.isActive !== undefined ? data.isActive : true,
        accountId: data.accountId || null,
      };
      if (targetIsSystemOrg) {
        createPayload.scopeLevel = scopeLevel;
        createPayload.scopeId = scopeId;
        if (scopeSectorIds != null) createPayload.scopeSectorIds = scopeSectorIds;
      }
      const user = await this.userRepository.create(req, createPayload);

      // Assign admin role to the user (or use data.roleIds for System org if provided later)
      await user.setRoles([adminRole.id]);

      // Reload user with roles
      const userWithRoles = await this.userRepository.findByIdWithRoles(
        req,
        user.id,
      );

      return {
        message: 'User created in organization successfully',
        data: userWithRoles,
      };
    } catch (error) {
      // Handle Sequelize validation errors
      if (error.name === 'SequelizeUniqueConstraintError') {
        throw new HttpError(
          409,
          'USER_ALREADY_EXISTS',
          `User with phone ${formattedPhone} already exists in this organization`,
        );
      }
      if (error.name === 'SequelizeValidationError') {
        const messages =
          error.errors?.map((e) => e.message).join(', ') || error.message;
        throw new HttpError(
          400,
          'VALIDATION_ERROR',
          `Validation failed: ${messages}`,
        );
      }
      if (error.name === 'SequelizeForeignKeyConstraintError') {
        throw new HttpError(
          400,
          'FOREIGN_KEY_ERROR',
          'Invalid organization reference',
        );
      }
      // Re-throw other errors
      throw error;
    }
  }

  // ===========================================================================
  // ORGANIZATION WALLETS
  // ===========================================================================

  listOrgWallets = async (req, organizationId) => {
    const { models } = await import('../../../../shared/db/data-source.js');
    const wallets = await models.OrganizationWallet.findAll({
      where: { organizationId },
      order: [['walletType', 'ASC']],
    });
    // Mask PIN in the response
    const data = wallets.map((w) => ({
      id: w.id,
      organizationId: w.organizationId,
      walletType: w.walletType,
      phone: w.phone,
      pin: w.pin ? '••••••' : null,
      config: w.config,
      active: w.active,
      createdAt: w.createdAt,
      updatedAt: w.updatedAt,
    }));
    return { data };
  };

  upsertOrgWallet = async (req, organizationId, body) => {
    const { models } = await import('../../../../shared/db/data-source.js');
    const { walletType, phone, pin, config, active } = body;
    if (!walletType)
      throw new HttpError(400, 'VALIDATION_ERROR', 'walletType is required');

    const [record, created] = await models.OrganizationWallet.findOrCreate({
      where: { organizationId, walletType },
      defaults: {
        organizationId,
        walletType,
        phone,
        pin,
        config: config ?? {},
        active: active ?? true,
      },
    });

    if (!created) {
      const updateData = {};
      if (phone !== undefined) updateData.phone = phone;
      // Only update PIN if a new non-masked value is provided
      if (pin !== undefined && pin !== '••••••' && !pin.startsWith('•'))
        updateData.pin = pin;
      if (config !== undefined) updateData.config = config;
      if (active !== undefined) updateData.active = active;
      await record.update(updateData);
    }

    return {
      message: created ? 'Wallet created' : 'Wallet updated',
      status: created ? 201 : 200,
      data: {
        id: record.id,
        organizationId: record.organizationId,
        walletType: record.walletType,
        phone: record.phone,
        pin: record.pin ? '••••••' : null,
        config: record.config,
        active: record.active,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      },
    };
  };

  deleteOrgWallet = async (req, organizationId, walletType) => {
    const { models } = await import('../../../../shared/db/data-source.js');
    const deleted = await models.OrganizationWallet.destroy({
      where: { organizationId, walletType },
    });
    if (!deleted)
      throw new HttpError(
        404,
        'WALLET_NOT_FOUND',
        'Wallet configuration not found',
      );
    return { message: 'Wallet configuration deleted' };
  };
}

/** CQRS command surface for organizations (inherits full use case implementation). */
export class OrganizationCommandService extends OrganizationService {
  async createOrganization(req, data) {
    const result = await super.createOrganization(req, data);
    return mapOrganizationCommandPayload(result);
  }

  async updateOrganization(req, id, data) {
    const result = await super.updateOrganization(req, id, data);
    return mapOrganizationCommandPayload(result);
  }

  async createOrganizationDetail(req, organizationId, data) {
    const result = await super.createOrganizationDetail(
      req,
      organizationId,
      data,
    );
    return mapOrganizationDetailCommandPayload(result);
  }

  async updateOrganizationDetail(req, organizationId, data) {
    const result = await super.updateOrganizationDetail(
      req,
      organizationId,
      data,
    );
    return mapOrganizationDetailCommandPayload(result);
  }

  async createUserInOrganization(req, data) {
    const result = await super.createUserInOrganization(req, data);
    return mapUserInOrgCommandPayload(result);
  }
}
