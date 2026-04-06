function briefOrganization(org) {
  if (!org) return org;
  return {
    id: org.id,
    name: org.name,
    tenantId: org.tenantId,
    isSystemOrganization: org.isSystemOrganization,
    isActive: org.isActive,
    parentId: org.parentId,
    organizationType: org.organizationType,
  };
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
    return {
      id: d.id,
      organizationId: d.organizationId,
      city: d.city,
      email: d.email,
      houseNumber: d.houseNumber,
      legalName: d.legalName,
      locality: d.locality,
      phone: d.phone,
      region: d.region,
      subCity: d.subCity,
      tin: d.tin,
      vatNumber: d.vatNumber,
      wereda: d.wereda,
      country: d.country,
      serialNumber: d.serialNumber,
      systemNumber: d.systemNumber,
      systemType: d.systemType,
      lastInvoiceCounter: d.lastInvoiceCounter,
      lastInvoiceReferenceNumber: d.lastInvoiceReferenceNumber,
      lastReceiptReferenceNumber: d.lastReceiptReferenceNumber,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    };
  }
}

export class OrganizationResponse {
  static toResponse(organization) {
    if (!organization) return organization;
    const response = {
      id: organization.id,
      name: organization.name,
      tenantId: organization.tenantId,
      isSystemOrganization: organization.isSystemOrganization,
      isActive: organization.isActive,
      parentId: organization.parentId,
      organizationType: organization.organizationType,
      country: organization.country,
      regionId: organization.regionId,
      zoneId: organization.zoneId,
      woredaId: organization.woredaId,
      latitude: organization.latitude,
      longitude: organization.longitude,
      sectorId: organization.sectorId,
      createdBy: organization.createdBy,
      updatedBy: organization.updatedBy,
      deletedBy: organization.deletedBy,
      createdAt: organization.createdAt,
      updatedAt: organization.updatedAt,
      deletedAt: organization.deletedAt,
    };

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
