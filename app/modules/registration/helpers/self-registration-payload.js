/**
 * Normalize multi-shape JSON (flat / data / organization wrappers) for self-registration.
 */

export function mergePayloadLayers(body) {
  if (!body || typeof body !== 'object') return {};
  const out = { ...body };
  if (
    body.data != null &&
    typeof body.data === 'object' &&
    !Array.isArray(body.data)
  ) {
    Object.assign(out, body.data);
  }
  if (
    body.organization != null &&
    typeof body.organization === 'object' &&
    !Array.isArray(body.organization)
  ) {
    Object.assign(out, body.organization);
  }
  return out;
}

export function pickTin(layer) {
  const v = layer?.tin ?? layer?.TIN;
  return v != null ? String(v).trim() : '';
}

export function pickOrganizationType(layer) {
  const v = layer?.organizationType ?? layer?.organization_type;
  return v != null ? String(v).trim().toUpperCase() : '';
}

export function pickRegistrationNumber(layer) {
  const v = layer?.registrationNumber ?? layer?.registration_number;
  return v == null || String(v).trim() === '' ? null : String(v).trim();
}

export function normalizeContacts(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((c) => c && typeof c === 'object')
    .map((c) => ({
      fullName: String(c.fullName ?? c.full_name ?? '').trim(),
      role: String(c.role ?? '').trim(),
      phone: c.phone != null ? String(c.phone).trim() : null,
      email: c.email != null ? String(c.email).trim().toLowerCase() : null,
      nationalId:
        c.nationalId != null || c.national_id != null
          ? String(c.nationalId ?? c.national_id).trim()
          : null,
      isPrimary: Boolean(c.isPrimary ?? c.is_primary),
    }));
}

export function normalizeOrgAddresses(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((a) => a && typeof a === 'object')
    .map((a) => ({
      purpose:
        a.purpose != null || a.addressPurpose != null
          ? String(a.purpose ?? a.addressPurpose).toUpperCase()
          : null,
      country: a.country != null ? String(a.country).trim() : null,
      region: a.region != null ? String(a.region).trim() : null,
      city: a.city != null ? String(a.city).trim() : null,
      subcity:
        a.subcity != null
          ? String(a.subcity).trim()
          : a.subCity != null
            ? String(a.subCity).trim()
            : null,
      woreda: a.woreda != null ? String(a.woreda).trim() : null,
      houseNumber:
        a.houseNumber != null
          ? String(a.houseNumber).trim()
          : a.house_number != null
            ? String(a.house_number).trim()
            : null,
      latitude:
        a.latitude != null && a.latitude !== ''
          ? Number(a.latitude)
          : null,
      longitude:
        a.longitude != null && a.longitude !== ''
          ? Number(a.longitude)
          : null,
    }));
}

export function normalizeFacilities(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((f) => f && typeof f === 'object')
    .map((f) => ({
      name: String(f.name ?? '').trim(),
      facilityType: String(
        f.facilityType ?? f.facility_type ?? 'FACTORY',
      ).toUpperCase(),
      licenseNumber:
        f.licenseNumber != null || f.license_number != null
          ? String(f.licenseNumber ?? f.license_number).trim()
          : null,
      capacity: f.capacity != null ? String(f.capacity).trim() : null,
      numberOfEmployees:
        f.numberOfEmployees != null || f.number_of_employees != null
          ? Number(f.numberOfEmployees ?? f.number_of_employees)
          : null,
      address:
        f.address && typeof f.address === 'object' ? f.address : null,
    }));
}

export function normalizeLicenses(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((l) => l && typeof l === 'object')
    .map((l) => ({
      licenseType: String(l.licenseType ?? l.license_type ?? '').trim(),
      licenseNumber: String(l.licenseNumber ?? l.license_number ?? '').trim(),
      issuedDate: l.issuedDate ?? l.issued_date ?? null,
      expiryDate: l.expiryDate ?? l.expiry_date ?? null,
    }));
}

export function normalizeStandards(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((s) => s && typeof s === 'object')
    .map((s) => ({
      standardName: String(s.standardName ?? s.standard_name ?? '').trim(),
      certificateNumber: String(
        s.certificateNumber ?? s.certificate_number ?? '',
      ).trim(),
      expiryDate: s.expiryDate ?? s.expiry_date ?? null,
    }));
}

/** Map a nested facility address (no purpose). */
export function mapPhysicalAddress(a) {
  if (!a || typeof a !== 'object') return null;
  const lat =
    a.latitude != null && a.latitude !== '' ? Number(a.latitude) : null;
  const lng =
    a.longitude != null && a.longitude !== '' ? Number(a.longitude) : null;
  return {
    country: a.country != null ? String(a.country).trim() : null,
    region: a.region != null ? String(a.region).trim() : null,
    city: a.city != null ? String(a.city).trim() : null,
    subcity:
      a.subcity != null
        ? String(a.subcity).trim()
        : a.subCity != null
          ? String(a.subCity).trim()
          : null,
    woreda: a.woreda != null ? String(a.woreda).trim() : null,
    houseNumber:
      a.houseNumber != null
        ? String(a.houseNumber).trim()
        : a.house_number != null
          ? String(a.house_number).trim()
          : null,
    latitude: lat != null && !Number.isNaN(lat) ? lat : null,
    longitude: lng != null && !Number.isNaN(lng) ? lng : null,
  };
}

export function normalizeAttachments(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((a) => a && typeof a === 'object')
    .map((a) => ({
      entityType: String(
        a.entityType ?? a.entity_type ?? 'ORGANIZATION',
      ).toUpperCase(),
      entityId: a.entityId ?? a.entity_id ?? null,
      fileName: String(a.fileName ?? a.file_name ?? '').trim(),
      fileUrl: String(a.fileUrl ?? a.file_url ?? '').trim(),
      fileType:
        a.fileType != null || a.file_type != null
          ? String(a.fileType ?? a.file_type).trim()
          : null,
    }));
}
