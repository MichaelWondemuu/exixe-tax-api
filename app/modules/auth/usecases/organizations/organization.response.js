import { BaseResponse } from '../../../../shared/responses/base.response.js';

function briefOrganization(org) {
  if (!org) return org;
  const response = {};
  BaseResponse.extendResponse(org, response);
  response.name = org.name;
  response.tenantId = org.tenantId;
  response.isSystemOrganization = org.isSystemOrganization;
  response.isActive = org.isActive;
  response.parentId = org.parentId;
  response.organizationType = org.organizationType;
  return response;
}

function associationBrief(node) {
  if (!node) return node;
  const n = node.get ? node.get({ plain: true }) : node;
  if (!n || typeof n !== 'object') return node;
  const out = { id: n.id };
  if (n.name != null) out.name = n.name;
  return out;
}

export class OrganizationDetailResponse {
  static toResponse(detail) {
    if (!detail) return detail;
    const d = detail.get ? detail.get({ plain: true }) : detail;
    const response = {};
    BaseResponse.extendResponse(d, response);
    response.city = d.city;
    response.email = d.email;
    response.houseNumber = d.houseNumber;
    response.legalName = d.legalName;
    response.locality = d.locality;
    response.phone = d.phone;
    response.region = d.region;
    response.subCity = d.subCity;
    response.tin = d.tin;
    response.operatorType = d.operatorType;
    response.operatorLicenseNumber = d.operatorLicenseNumber;
    response.merchantId = d.merchantId;
    response.merchantName = d.merchantName;
    response.vatNumber = d.vatNumber;
    response.wereda = d.wereda;
    response.country = d.country;
    response.serialNumber = d.serialNumber;
    response.systemNumber = d.systemNumber;
    response.systemType = d.systemType;
    response.lastInvoiceCounter = d.lastInvoiceCounter;
    response.lastInvoiceReferenceNumber = d.lastInvoiceReferenceNumber;
    response.lastReceiptReferenceNumber = d.lastReceiptReferenceNumber;
    return response;
  }
}

export class OrganizationResponse {
  static toResponse(organization) {
    if (!organization) return organization;
    const response = {};
    BaseResponse.extendResponse(organization, response);
    response.name = organization.name;
    response.tenantId = organization.tenantId;
    response.isSystemOrganization = organization.isSystemOrganization;
    response.isActive = organization.isActive;
    response.parentId = organization.parentId;
    response.organizationType = organization.organizationType;
    response.country = organization.country;
    response.regionId = organization.regionId;
    response.zoneId = organization.zoneId;
    response.woredaId = organization.woredaId;
    response.latitude = organization.latitude;
    response.longitude = organization.longitude;
    response.sectorId = organization.sectorId;

    if (organization.parent) {
      response.parent = briefOrganization(organization.parent);
    }
    if (Array.isArray(organization.children)) {
      response.children = organization.children.map((child) =>
        briefOrganization(child),
      );
    }
    if (Array.isArray(organization.sisterOrganizations)) {
      response.sisterOrganizations = organization.sisterOrganizations.map(
        (sister) => briefOrganization(sister),
      );
    }
    if (organization.detail) {
      response.detail = OrganizationDetailResponse.toResponse(organization.detail);
    }
    if (organization.region) {
      response.region = associationBrief(organization.region);
    }
    if (organization.zone) {
      response.zone = associationBrief(organization.zone);
    }
    if (organization.woreda) {
      response.woreda = associationBrief(organization.woreda);
    }
    if (organization.sector) {
      response.sector = associationBrief(organization.sector);
    }

    return response;
  }
}
