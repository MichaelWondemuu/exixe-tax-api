import { HttpError } from '../../../shared/utils/http-error.js';
import {
  ADDRESS_PURPOSES,
  ATTACHMENT_ENTITY_TYPES,
  FACILITY_TYPES,
  ORGANIZATION_TYPES,
} from '../constants/self-registration.enums.js';
import { assignDefaultAddressPurposes } from '../helpers/self-registration-address-purposes.js';

function isValidDateOnly(v) {
  if (v == null || v === '') return true;
  const d = new Date(v);
  return !Number.isNaN(d.getTime());
}

/** @param {object} args */
export function assertSelfRegistrationRules(args) {
  const {
    tin,
    organizationType,
    contacts,
    addresses,
    facilities,
    licenses,
    standards,
    attachments,
  } = args;

  const tinStr = String(tin ?? '').trim();
  if (!tinStr) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'tin is required');
  }

  const orgType = String(organizationType ?? '').trim().toUpperCase();
  if (!ORGANIZATION_TYPES.includes(orgType)) {
    throw new HttpError(
      400,
      'VALIDATION_ERROR',
      `organizationType must be one of: ${ORGANIZATION_TYPES.join(', ')}`,
    );
  }

  assignDefaultAddressPurposes(addresses);

  if (contacts.length === 0) {
    throw new HttpError(
      400,
      'VALIDATION_ERROR',
      'At least one contact is required',
    );
  }

  const hasCeo = contacts.some(
    (c) => String(c.role).toUpperCase() === 'CEO',
  );
  if (!hasCeo) {
    throw new HttpError(
      400,
      'VALIDATION_ERROR',
      'At least one contact with role CEO is required',
    );
  }

  for (const c of contacts) {
    if (!c.fullName) {
      throw new HttpError(
        400,
        'VALIDATION_ERROR',
        'Each contact must include fullName',
      );
    }
    if (!c.role) {
      throw new HttpError(
        400,
        'VALIDATION_ERROR',
        'Each contact must include role',
      );
    }
  }

  if (addresses.length === 0) {
    throw new HttpError(
      400,
      'VALIDATION_ERROR',
      'At least one organization address is required',
    );
  }

  for (const a of addresses) {
    if (!ADDRESS_PURPOSES.includes(a.purpose)) {
      throw new HttpError(
        400,
        'VALIDATION_ERROR',
        `address purpose must be one of: ${ADDRESS_PURPOSES.join(', ')}`,
      );
    }
  }

  const purposeCount = new Map();
  for (const a of addresses) {
    purposeCount.set(a.purpose, (purposeCount.get(a.purpose) || 0) + 1);
  }
  for (const [p, n] of purposeCount) {
    if (n > 1) {
      throw new HttpError(
        400,
        'VALIDATION_ERROR',
        `Duplicate organization address purpose: ${p}`,
      );
    }
  }

  for (const f of facilities) {
    if (!f.name) {
      throw new HttpError(
        400,
        'VALIDATION_ERROR',
        'Each facility must include name',
      );
    }
    if (!FACILITY_TYPES.includes(f.facilityType)) {
      throw new HttpError(
        400,
        'VALIDATION_ERROR',
        `facilityType must be one of: ${FACILITY_TYPES.join(', ')}`,
      );
    }
  }

  if (licenses.length > 0) {
    for (const l of licenses) {
      if (!l.licenseType || !l.licenseNumber) {
        throw new HttpError(
          400,
          'VALIDATION_ERROR',
          'Each license must include licenseType and licenseNumber',
        );
      }
      if (!isValidDateOnly(l.issuedDate) || !isValidDateOnly(l.expiryDate)) {
        throw new HttpError(
          400,
          'VALIDATION_ERROR',
          'Invalid license issuedDate or expiryDate',
        );
      }
    }
  }

  if (standards.length > 0) {
    for (const s of standards) {
      if (!s.standardName) {
        throw new HttpError(
          400,
          'VALIDATION_ERROR',
          'Each standard must include standardName',
        );
      }
    }
  }

  if (attachments.length > 0) {
    for (const a of attachments) {
      if (!ATTACHMENT_ENTITY_TYPES.includes(a.entityType)) {
        throw new HttpError(
          400,
          'VALIDATION_ERROR',
          `attachment entityType must be one of: ${ATTACHMENT_ENTITY_TYPES.join(', ')}`,
        );
      }
      if (!a.fileName || !a.fileUrl) {
        throw new HttpError(
          400,
          'VALIDATION_ERROR',
          'Each attachment must include fileName and fileUrl',
        );
      }
    }
  }
}

/**
 * @param {Array<{ expiryDate?: string | null }>} licenses
 * @param {number} warningDays
 */
export function computeLicenseExpiryWarnings(licenses, warningDays) {
  const warnings = [];
  const now = new Date();
  const horizon = new Date(now);
  horizon.setUTCDate(horizon.getUTCDate() + warningDays);

  let idx = 0;
  for (const l of licenses) {
    if (!l.expiryDate) {
      idx += 1;
      continue;
    }
    const exp = new Date(l.expiryDate);
    if (Number.isNaN(exp.getTime())) {
      idx += 1;
      continue;
    }
    if (exp <= horizon) {
      warnings.push({
        index: idx,
        licenseType: l.licenseType,
        licenseNumber: l.licenseNumber,
        expiryDate: l.expiryDate,
        message: `License expires within ${warningDays} days`,
      });
    }
    idx += 1;
  }
  return warnings;
}
