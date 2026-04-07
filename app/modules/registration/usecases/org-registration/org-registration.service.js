import { randomBytes } from 'node:crypto';
import { HttpError } from '../../../../shared/utils/http-error.js';
import { env } from '../../../../config/env.js';
import { sequelize, models } from '../../../../shared/db/data-source.js';
import { getUser } from '../../../auth/middleware/user-context.js';
import { ensureDefaultBusinessTypes } from '../../../lookup/repository/business-type.repository.js';
import { mergePayloadLayers, pickTin, pickOrganizationType, pickRegistrationNumber, normalizeContacts, normalizeOrgAddresses, normalizeFacilities, normalizeLicenses, normalizeStandards, normalizeAttachments, mapPhysicalAddress } from '../../helpers/self-registration-payload.js';
import {
  assertSelfRegistrationRules,
  computeLicenseExpiryWarnings,
} from '../../validators/self-registration-validation.js';

const STATUSES = ['PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'];

const UUID_V4_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

let registrationSchemaReadyPromise = null;

const HOIST_KEYS = new Set([
  'legal_name',
  'legalName',
  'seller_legal_name',
  'sellerLegalName',
  'name',
  'business_type_id',
  'businessTypeId',
  'contact_email',
  'contactEmail',
  'contact_phone',
  'contactPhone',
  'details',
  'data',
  'organization',
  'reference',
  'tin',
  'organizationType',
  'organization_type',
  'registrationNumber',
  'registration_number',
  'contacts',
  'addresses',
  'facilities',
  'licenses',
  'attachments',
  'standards',
]);

const FULL_APPLICATION_INCLUDE = [
  {
    association: 'businessType',
    attributes: ['id', 'code', 'name'],
  },
  {
    association: 'registrationOrganization',
    required: false,
    include: [
      { association: 'contacts' },
      {
        association: 'organizationAddresses',
        include: [{ association: 'address' }],
      },
      {
        association: 'facilities',
        include: [{ association: 'siteAddress' }],
      },
      { association: 'licenses' },
      { association: 'attachments' },
      { association: 'standards' },
    ],
  },
  {
    association: 'approvalLogs',
    separate: true,
    order: [['created_at', 'ASC']],
  },
];

/** Resolve legal name from flat or nested payloads (aligns with organization detail field aliases). */
function pickLegalName(body) {
  if (!body || typeof body !== 'object') return '';
  const layers = [];
  layers.push(body);
  if (
    body.data != null &&
    typeof body.data === 'object' &&
    !Array.isArray(body.data)
  ) {
    layers.push(body.data);
  }
  if (
    body.organization != null &&
    typeof body.organization === 'object' &&
    !Array.isArray(body.organization)
  ) {
    layers.push(body.organization);
  }
  for (const layer of layers) {
    const v =
      layer.legal_name ??
      layer.legalName ??
      layer.seller_legal_name ??
      layer.sellerLegalName ??
      layer.organization_name ??
      layer.organizationName ??
      layer.name;
    if (v != null && String(v).trim() !== '') {
      return String(v).trim();
    }
  }
  return '';
}

/** Primary contact: explicit isPrimary, else first entry with email/phone, else first entry. */
function pickPrimaryContact(contacts) {
  if (!Array.isArray(contacts) || contacts.length === 0) return null;
  const primary = contacts.find((c) => c && c.isPrimary === true);
  if (primary) return primary;
  const withChannel = contacts.find(
    (c) =>
      c &&
      (String(c.email ?? '').trim() !== '' ||
        String(c.phone ?? '').trim() !== ''),
  );
  return withChannel ?? contacts[0];
}

function mergeDetailLayer(target, layer) {
  if (!layer || typeof layer !== 'object' || Array.isArray(layer)) return;
  for (const [k, v] of Object.entries(layer)) {
    if (HOIST_KEYS.has(k)) continue;
    target[k] = v;
  }
}

function buildDetails(body) {
  if (!body || typeof body !== 'object') return null;
  const rest = {};
  mergeDetailLayer(rest, body);
  if (
    body.data != null &&
    typeof body.data === 'object' &&
    !Array.isArray(body.data)
  ) {
    mergeDetailLayer(rest, body.data);
  }
  if (
    body.organization != null &&
    typeof body.organization === 'object' &&
    !Array.isArray(body.organization)
  ) {
    mergeDetailLayer(rest, body.organization);
  }
  if (
    body.details &&
    typeof body.details === 'object' &&
    !Array.isArray(body.details)
  ) {
    Object.assign(rest, body.details);
  }
  return Object.keys(rest).length ? rest : null;
}

async function allocateApplicationReference(Model) {
  const year = new Date().getUTCFullYear();
  for (let attempt = 0; attempt < 16; attempt += 1) {
    const suffix = randomBytes(4).toString('hex').toUpperCase();
    const reference = `REG-${year}-${suffix}`;
    const clash = await Model.findOne({
      where: { reference },
      paranoid: false,
    });
    if (!clash) {
      return reference;
    }
  }
  throw new HttpError(
    500,
    'SERVER_ERROR',
    'Could not allocate application reference',
  );
}

async function ensureRegistrationApplicationSchema() {
  if (registrationSchemaReadyPromise) {
    return registrationSchemaReadyPromise;
  }

  registrationSchemaReadyPromise = (async () => {
    await sequelize.query(`
      ALTER TABLE "org_registration_applications"
      ADD COLUMN IF NOT EXISTS "tin" VARCHAR(64),
      ADD COLUMN IF NOT EXISTS "organization_type" VARCHAR(32),
      ADD COLUMN IF NOT EXISTS "registration_number" VARCHAR(128),
      ADD COLUMN IF NOT EXISTS "submitted_at" TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS "reviewed_at" TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS "reviewed_by_user_id" UUID,
      ADD COLUMN IF NOT EXISTS "rejection_reason" TEXT,
      ADD COLUMN IF NOT EXISTS "reference" VARCHAR(48),
      ADD COLUMN IF NOT EXISTS "adjustment_history" JSONB DEFAULT '[]'::jsonb
    `);
  })().catch((error) => {
    registrationSchemaReadyPromise = null;
    throw error;
  });

  return registrationSchemaReadyPromise;
}

export class OrgRegistrationService {
  /**
   * @param {{
   *   applicationRepository: import('../../repository/org-registration-application.repository.js').OrgRegistrationApplicationRepository;
   *   businessTypeRepository: import('../../../lookup/repository/business-type.repository.js').BusinessTypeRepository;
   * }} deps
   */
  constructor({ applicationRepository, businessTypeRepository }) {
    this.applicationRepository = applicationRepository;
    this.businessTypeRepository = businessTypeRepository;
  }

  /**
   * @returns {Promise<{ application: import('sequelize').Model; warnings: object[] }>}
   */
  async submitApplication(_req, body) {
    await ensureRegistrationApplicationSchema();
    await ensureDefaultBusinessTypes();
    const legalName = pickLegalName(body);
    if (!legalName) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'legal_name is required');
    }
    if (tinNumber && tinNumber.length > 64) {
      throw new HttpError(
        400,
        'VALIDATION_ERROR',
        'tin_number must be at most 64 characters',
      );
    }

    let businessTypeId =
      body.business_type_id ??
      body.businessTypeId ??
      body.data?.business_type_id ??
      body.data?.businessTypeId ??
      null;
    if (businessTypeId) {
      const bt = await this.businessTypeRepository.findByIdRaw(businessTypeId);
      if (!bt) {
        throw new HttpError(404, 'NOT_FOUND', 'Business type not found');
      }
    }

    const payload = mergePayloadLayers(body);
    const contact = pickPrimaryContact(payload.contacts);
    let contactEmail =
      body.contact_email ?? body.contactEmail ?? contact?.email ?? null;
    let contactPhone =
      body.contact_phone ?? body.contactPhone ?? contact?.phone ?? null;
    if (contactEmail != null) contactEmail = String(contactEmail).trim() || null;
    if (contactPhone != null) contactPhone = String(contactPhone).trim() || null;

    const AppModel = this.applicationRepository.getModel();
    const reference = await allocateApplicationReference(AppModel);

    const tinStr = pickTin(payload);
    const hasStructuredPayload =
      tinStr !== '' &&
      Array.isArray(payload.contacts) &&
      payload.contacts.length > 0 &&
      Array.isArray(payload.addresses) &&
      payload.addresses.length > 0;

    if (!hasStructuredPayload) {
      const application = await AppModel.create({
        reference,
        legalName,
        businessTypeId,
        contactEmail,
        contactPhone,
        details: buildDetails(body),
        adjustmentHistory: [],
        status: 'PENDING',
        submittedAt: new Date(),
      });
      await models.OrgRegistrationApprovalLog.create({
        applicationId: application.id,
        action: 'SUBMITTED',
        actorUserId: null,
        meta: { reference, legacyPayload: true },
      });
      const reloaded = await application.reload({
        include: FULL_APPLICATION_INCLUDE,
      });
      return { application: reloaded, warnings: [] };
    }

    const organizationType = pickOrganizationType(payload);
    const contacts = normalizeContacts(payload.contacts);
    const addresses = normalizeOrgAddresses(payload.addresses);
    const facilities = normalizeFacilities(payload.facilities);
    const licenses = normalizeLicenses(payload.licenses);
    const standards = normalizeStandards(payload.standards);
    const attachments = normalizeAttachments(payload.attachments);

    assertSelfRegistrationRules({
      tin: tinStr,
      organizationType,
      contacts,
      addresses,
      facilities,
      licenses,
      standards,
      attachments,
    });

    const tinDup = await AppModel.findOne({
      where: { tin: tinStr },
      paranoid: false,
    });
    if (tinDup) {
      throw new HttpError(409, 'CONFLICT', 'TIN already registered');
    }

    const registrationNumber = pickRegistrationNumber(payload);
    const warnings = computeLicenseExpiryWarnings(
      licenses,
      env.selfRegistration.licenseExpiryWarningDays,
    );

    const application = await sequelize.transaction(async (t) => {
      const app = await AppModel.create(
        {
          reference,
          legalName,
          businessTypeId,
          contactEmail,
          contactPhone,
          tin: tinStr,
          organizationType,
          registrationNumber,
          details: buildDetails(body),
          adjustmentHistory: [],
          status: 'PENDING',
          submittedAt: new Date(),
        },
        { transaction: t },
      );

      const org = await models.SelfRegOrganization.create(
        { applicationId: app.id },
        { transaction: t },
      );

      for (const c of contacts) {
        await models.SelfRegContact.create(
          {
            organizationId: org.id,
            fullName: c.fullName,
            role: c.role,
            phone: c.phone,
            email: c.email,
            nationalId: c.nationalId,
            isPrimary: c.isPrimary,
          },
          { transaction: t },
        );
      }

      for (const a of addresses) {
        const addrRow = await models.SelfRegAddress.create(
          {
            country: a.country,
            region: a.region,
            city: a.city,
            subcity: a.subcity,
            woreda: a.woreda,
            houseNumber: a.houseNumber,
            latitude: a.latitude,
            longitude: a.longitude,
          },
          { transaction: t },
        );
        await models.SelfRegOrganizationAddress.create(
          {
            organizationId: org.id,
            addressId: addrRow.id,
            purpose: a.purpose,
          },
          { transaction: t },
        );
      }

      const facilityRows = [];
      for (const f of facilities) {
        let addressId = null;
        const phys = mapPhysicalAddress(f.address);
        if (phys && Object.values(phys).some((v) => v != null && v !== '')) {
          const site = await models.SelfRegAddress.create(phys, {
            transaction: t,
          });
          addressId = site.id;
        }
        const fac = await models.SelfRegFacility.create(
          {
            organizationId: org.id,
            name: f.name,
            facilityType: f.facilityType,
            licenseNumber: f.licenseNumber,
            capacity: f.capacity,
            numberOfEmployees: Number.isFinite(f.numberOfEmployees)
              ? f.numberOfEmployees
              : null,
            addressId,
          },
          { transaction: t },
        );
        facilityRows.push(fac);
      }

      for (const l of licenses) {
        await models.SelfRegLicense.create(
          {
            organizationId: org.id,
            licenseType: l.licenseType,
            licenseNumber: l.licenseNumber,
            issuedDate: l.issuedDate || null,
            expiryDate: l.expiryDate || null,
          },
          { transaction: t },
        );
      }

      for (const s of standards) {
        await models.SelfRegStandard.create(
          {
            organizationId: org.id,
            standardName: s.standardName,
            certificateNumber: s.certificateNumber || null,
            expiryDate: s.expiryDate || null,
          },
          { transaction: t },
        );
      }

      for (let i = 0; i < attachments.length; i += 1) {
        const a = attachments[i];
        let entityId = a.entityId;
        if (
          entityId &&
          typeof entityId === 'string' &&
          entityId.startsWith('__facility_')
        ) {
          const idx = Number.parseInt(entityId.replace('__facility_', ''), 10);
          if (
            Number.isFinite(idx) &&
            idx >= 0 &&
            idx < facilityRows.length
          ) {
            entityId = facilityRows[idx].id;
          } else {
            entityId = null;
          }
        }
        await models.SelfRegAttachment.create(
          {
            organizationId: org.id,
            entityType: a.entityType,
            entityId:
              entityId &&
              typeof entityId === 'string' &&
              /^[0-9a-f-]{36}$/i.test(entityId)
                ? entityId
                : null,
            fileName: a.fileName,
            fileUrl: a.fileUrl,
            fileType: a.fileType,
          },
          { transaction: t },
        );
      }

      await models.OrgRegistrationApprovalLog.create(
        {
          applicationId: app.id,
          action: 'SUBMITTED',
          actorUserId: null,
          meta: { reference, tin: tinStr },
        },
        { transaction: t },
      );

      return app.reload({ include: FULL_APPLICATION_INCLUDE, transaction: t });
    });

    return { application, warnings };
  }

  async getApplication(_req, id) {
    await ensureRegistrationApplicationSchema();
    const row = await this.applicationRepository.getModel().findByPk(id, {
      include: FULL_APPLICATION_INCLUDE,
    });
    if (!row) {
      throw new HttpError(404, 'NOT_FOUND', 'Application not found');
    }
    return row;
  }

  async getApplicationByReference(_req, reference) {
    await ensureRegistrationApplicationSchema();
    const ref = reference != null ? String(reference).trim() : '';
    if (!ref) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'reference is required');
    }
    const row = await this.applicationRepository.getModel().findOne({
      where: { reference: ref },
      include: FULL_APPLICATION_INCLUDE,
    });
    if (!row) {
      throw new HttpError(404, 'NOT_FOUND', 'Application not found');
    }
    return row;
  }

  /**
   * Public tracking URL: /applications/status/:code — resolve by reference, else by application UUID.
   */
  async getApplicationByTrackingCode(_req, code) {
    await ensureRegistrationApplicationSchema();
    const raw = code != null ? String(code).trim() : '';
    if (!raw) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'code is required');
    }
    const byRef = await this.applicationRepository.getModel().findOne({
      where: { reference: raw },
      include: FULL_APPLICATION_INCLUDE,
    });
    if (byRef) {
      return byRef;
    }
    if (UUID_V4_RE.test(raw)) {
      return this.getApplication(_req, raw);
    }
    throw new HttpError(404, 'NOT_FOUND', 'Application not found');
  }

  /**
   * Admin partial update: core fields, shallow-merge details, audit trail in adjustmentHistory.
   * @param {Record<string, unknown>} body
   */
  async adjustApplication(_req, id, body) {
    await ensureRegistrationApplicationSchema();
    const Model = this.applicationRepository.getModel();
    const row = await Model.findByPk(id);
    if (!row) {
      throw new HttpError(404, 'NOT_FOUND', 'Application not found');
    }

    const updates = {};
    const legal = body.legal_name ?? body.legalName;
    if (legal != null && String(legal).trim() !== '') {
      updates.legalName = String(legal).trim();
    }

    if (Object.prototype.hasOwnProperty.call(body, 'tin')) {
      const t = body.tin != null ? String(body.tin).trim() : '';
      if (t) {
        const dup = await Model.findOne({
          where: { tin: t },
          paranoid: false,
        });
        if (dup && dup.id !== row.id) {
          throw new HttpError(409, 'CONFLICT', 'TIN already registered');
        }
        updates.tin = t;
      }
    }

    if (
      Object.prototype.hasOwnProperty.call(body, 'organization_type') ||
      Object.prototype.hasOwnProperty.call(body, 'organizationType')
    ) {
      const ot = body.organization_type ?? body.organizationType;
      updates.organizationType =
        ot == null || String(ot).trim() === ''
          ? null
          : String(ot).trim().toUpperCase();
    }

    if (
      Object.prototype.hasOwnProperty.call(body, 'registration_number') ||
      Object.prototype.hasOwnProperty.call(body, 'registrationNumber')
    ) {
      const rn = body.registration_number ?? body.registrationNumber;
      updates.registrationNumber =
        rn == null || String(rn).trim() === '' ? null : String(rn).trim();
    }

    if (
      Object.prototype.hasOwnProperty.call(body, 'contact_email') ||
      Object.prototype.hasOwnProperty.call(body, 'contactEmail')
    ) {
      const v = body.contact_email ?? body.contactEmail;
      updates.contactEmail =
        v == null || String(v).trim() === '' ? null : String(v).trim();
    }
    if (
      Object.prototype.hasOwnProperty.call(body, 'contact_phone') ||
      Object.prototype.hasOwnProperty.call(body, 'contactPhone')
    ) {
      const v = body.contact_phone ?? body.contactPhone;
      updates.contactPhone =
        v == null || String(v).trim() === '' ? null : String(v).trim();
    }

    if (
      Object.prototype.hasOwnProperty.call(body, 'business_type_id') ||
      Object.prototype.hasOwnProperty.call(body, 'businessTypeId')
    ) {
      const bt = body.business_type_id ?? body.businessTypeId;
      if (bt == null || bt === '') {
        updates.businessTypeId = null;
      } else {
        const found = await this.businessTypeRepository.findByIdRaw(bt);
        if (!found) {
          throw new HttpError(404, 'NOT_FOUND', 'Business type not found');
        }
        updates.businessTypeId = bt;
      }
    }

    if (
      body.details != null &&
      typeof body.details === 'object' &&
      !Array.isArray(body.details)
    ) {
      const prev =
        row.details &&
        typeof row.details === 'object' &&
        !Array.isArray(row.details)
          ? row.details
          : {};
      updates.details = { ...prev, ...body.details };
    }

    const noteRaw = body.adjustment_note ?? body.adjustmentNote;
    const hasNote = noteRaw != null && String(noteRaw).trim() !== '';

    if (Object.keys(updates).length === 0 && !hasNote) {
      throw new HttpError(
        400,
        'VALIDATION_ERROR',
        'No changes provided (use legal_name, contact fields, business_type_id, details, and/or adjustment_note)',
      );
    }

    const history = Array.isArray(row.adjustmentHistory)
      ? [...row.adjustmentHistory]
      : [];
    history.push({
      adjustedAt: new Date().toISOString(),
      note: hasNote ? String(noteRaw).trim() : null,
      fields: Object.keys(updates),
    });
    updates.adjustmentHistory = history;

    await row.update(updates);
    return row.reload({ include: FULL_APPLICATION_INCLUDE });
  }

  async updateStatus(
    req,
    id,
    { status, review_note: reviewNote, rejection_reason: rejectionReason },
  ) {
    await ensureRegistrationApplicationSchema();
    if (!STATUSES.includes(status)) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'Invalid status');
    }
    const Model = this.applicationRepository.getModel();
    const row = await Model.findByPk(id);
    if (!row) {
      throw new HttpError(404, 'NOT_FOUND', 'Application not found');
    }

    const user = getUser(req);
    const actorUserId = user?.userId ?? null;
    const now = new Date();

    const patch = {
      status,
      reviewNote: reviewNote ?? null,
      reviewedAt: now,
      reviewedByUserId: actorUserId,
    };

    if (status === 'REJECTED') {
      patch.rejectionReason =
        rejectionReason != null && String(rejectionReason).trim() !== ''
          ? String(rejectionReason).trim()
          : reviewNote != null && String(reviewNote).trim() !== ''
            ? String(reviewNote).trim()
            : null;
    } else {
      patch.rejectionReason = null;
    }

    await row.update(patch);

    let logAction = null;
    if (status === 'UNDER_REVIEW') {
      logAction = 'REVIEWED';
    } else if (status === 'APPROVED') {
      logAction = 'APPROVED';
    } else if (status === 'REJECTED') {
      logAction = 'REJECTED';
    }

    if (logAction) {
      await models.OrgRegistrationApprovalLog.create({
        applicationId: row.id,
        action: logAction,
        actorUserId,
        meta: {
          status,
          reviewNote: reviewNote ?? null,
          rejectionReason: patch.rejectionReason ?? null,
        },
      });
    }

    return row.reload({ include: FULL_APPLICATION_INCLUDE });
  }
}
