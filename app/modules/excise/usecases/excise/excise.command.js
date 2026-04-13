import { randomBytes } from 'crypto';
import { HttpError } from '../../../../shared/utils/http-error.js';
import { sequelize } from '../../../../shared/db/database.js';
import { models } from '../../../../shared/db/data-source.js';
import { getUser } from '../../../auth/middleware/user-context.js';
import {
  DELIVERY_NOTE_STATUS,
  FORECAST_STATUS,
  FACILITY_TYPES,
  STAMP_PAYMENT_STATUS,
  STAMP_RETURN_REASON,
  STAMP_STOCK_EVENT_STATUS,
  STAMP_STOCK_EVENT_TYPE,
  STAMP_TRANSFER_REASON,
  STAMP_VERIFICATION_ACTOR_TYPE,
  STAMP_VERIFICATION_CHANNEL,
  STAMP_VERIFICATION_RESULT,
  STAMP_WASTAGE_REASON,
  STAMP_REQUEST_STATUS,
} from '../../constants/excise.enums.js';
import { ensureStampRequestSchema } from './ensure-stamp-request-schema.js';
import {
  ensureExciseConfigSchema,
  EXCISE_CONFIG_KEYS,
  EXCISE_DEFAULT_CONFIGS,
} from './ensure-excise-config-schema.js';
import { DeliveryNoteResponse } from '../delivery-note/delivery-note.response.js';
import { FacilityResponse } from '../facility/facility.response.js';
import { ForecastResponse } from '../forecast/forecast.response.js';
import { StampRequestResponse } from '../stamp-request/stamp-request.response.js';
import { StampStockEventResponse } from '../stamp-stock-event/stamp-stock-event.response.js';
import { StampVerificationResponse } from '../stamp-verification/stamp-verification.response.js';

const DELIVERY_NOTE_TRANSITIONS = Object.freeze({
  [DELIVERY_NOTE_STATUS.DRAFT]: [
    DELIVERY_NOTE_STATUS.SUBMITTED,
    DELIVERY_NOTE_STATUS.CANCELLED,
  ],
  [DELIVERY_NOTE_STATUS.SUBMITTED]: [
    DELIVERY_NOTE_STATUS.APPROVED,
    DELIVERY_NOTE_STATUS.CANCELLED,
  ],
  [DELIVERY_NOTE_STATUS.APPROVED]: [
    DELIVERY_NOTE_STATUS.DISPATCHED,
    DELIVERY_NOTE_STATUS.CANCELLED,
  ],
  [DELIVERY_NOTE_STATUS.DISPATCHED]: [DELIVERY_NOTE_STATUS.RECEIVED],
  [DELIVERY_NOTE_STATUS.RECEIVED]: [],
  [DELIVERY_NOTE_STATUS.CANCELLED]: [],
});

const STAMP_REQUEST_TRANSITIONS = Object.freeze({
  [STAMP_REQUEST_STATUS.DRAFT]: [
    STAMP_REQUEST_STATUS.SUBMITTED,
    STAMP_REQUEST_STATUS.CANCELLED,
  ],
  [STAMP_REQUEST_STATUS.SUBMITTED]: [
    STAMP_REQUEST_STATUS.APPROVED,
    STAMP_REQUEST_STATUS.REJECTED,
    STAMP_REQUEST_STATUS.CANCELLED,
  ],
  [STAMP_REQUEST_STATUS.APPROVED]: [
    STAMP_REQUEST_STATUS.FULFILLED,
    STAMP_REQUEST_STATUS.CANCELLED,
  ],
  [STAMP_REQUEST_STATUS.REJECTED]: [STAMP_REQUEST_STATUS.DRAFT],
  [STAMP_REQUEST_STATUS.FULFILLED]: [],
  [STAMP_REQUEST_STATUS.CANCELLED]: [],
});

const STOCK_EVENT_TRANSITIONS = Object.freeze({
  [STAMP_STOCK_EVENT_STATUS.DRAFT]: [
    STAMP_STOCK_EVENT_STATUS.SUBMITTED,
    STAMP_STOCK_EVENT_STATUS.CANCELLED,
  ],
  [STAMP_STOCK_EVENT_STATUS.SUBMITTED]: [
    STAMP_STOCK_EVENT_STATUS.APPROVED,
    STAMP_STOCK_EVENT_STATUS.REJECTED,
    STAMP_STOCK_EVENT_STATUS.CANCELLED,
  ],
  [STAMP_STOCK_EVENT_STATUS.APPROVED]: [STAMP_STOCK_EVENT_STATUS.COMPLETED],
  [STAMP_STOCK_EVENT_STATUS.REJECTED]: [STAMP_STOCK_EVENT_STATUS.DRAFT],
  [STAMP_STOCK_EVENT_STATUS.COMPLETED]: [],
  [STAMP_STOCK_EVENT_STATUS.CANCELLED]: [],
});

let forecastSchemaReadyPromise = null;
let stockEventSchemaReadyPromise = null;
let verificationSchemaReadyPromise = null;

function trimOrNull(value) {
  if (value === undefined || value === null) return null;
  const cleaned = String(value).trim();
  return cleaned.length > 0 ? cleaned : null;
}

function ensureFutureDate(rawDate, fieldName) {
  const date = new Date(rawDate);
  if (Number.isNaN(date.getTime())) {
    throw new HttpError(400, 'VALIDATION_ERROR', `${fieldName} must be a valid date`);
  }
  return date;
}

function ensurePositiveInteger(rawValue, fieldName) {
  const value = Number(rawValue);
  if (!Number.isInteger(value) || value <= 0) {
    throw new HttpError(
      400,
      'VALIDATION_ERROR',
      `${fieldName} must be a positive integer`,
    );
  }
  return value;
}

function toDateOnlyUtc(date) {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

function addWorkingDays(baseDate, daysToAdd) {
  const out = toDateOnlyUtc(baseDate);
  let remaining = Number(daysToAdd);
  while (remaining > 0) {
    out.setUTCDate(out.getUTCDate() + 1);
    const day = out.getUTCDay();
    if (day !== 0 && day !== 6) {
      remaining -= 1;
    }
  }
  return out;
}

function toUtcMonthStart(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function parseMonthString(monthText, fieldName = 'month') {
  const value = String(monthText || '').trim();
  const match = /^(\d{4})-(\d{2})(?:-(\d{2}))?$/.exec(value);
  if (!match) {
    throw new HttpError(
      400,
      'VALIDATION_ERROR',
      `${fieldName} must be in YYYY-MM format`,
    );
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) {
    throw new HttpError(400, 'VALIDATION_ERROR', `${fieldName} has invalid month`);
  }
  return new Date(Date.UTC(year, month - 1, 1));
}

function monthKey(date) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function normalizeMonthlyPlan(rawPlan) {
  if (!Array.isArray(rawPlan) || rawPlan.length !== 6) {
    throw new HttpError(
      400,
      'VALIDATION_ERROR',
      'monthlyPlan must contain exactly 6 month entries',
    );
  }

  const normalized = rawPlan.map((entry, idx) => {
    const month = parseMonthString(entry?.month, `monthlyPlan[${idx}].month`);
    const quantity = Number(entry?.quantity);
    if (!Number.isInteger(quantity) || quantity < 0) {
      throw new HttpError(
        400,
        'VALIDATION_ERROR',
        `monthlyPlan[${idx}].quantity must be a non-negative integer`,
      );
    }
    return {
      monthDate: month,
      month: monthKey(month),
      quantity,
    };
  });

  normalized.sort((a, b) => a.monthDate.getTime() - b.monthDate.getTime());
  for (let i = 1; i < normalized.length; i += 1) {
    const prev = normalized[i - 1].monthDate;
    const expected = new Date(Date.UTC(prev.getUTCFullYear(), prev.getUTCMonth() + 1, 1));
    if (normalized[i].monthDate.getTime() !== expected.getTime()) {
      throw new HttpError(
        400,
        'VALIDATION_ERROR',
        'monthlyPlan months must be 6 consecutive months',
      );
    }
  }

  return {
    startMonthDate: normalized[0].monthDate,
    monthlyPlan: normalized.map((x) => ({ month: x.month, quantity: x.quantity })),
  };
}

async function ensureForecastSchema() {
  if (forecastSchemaReadyPromise) {
    return forecastSchemaReadyPromise;
  }

  forecastSchemaReadyPromise = (async () => {
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "excise_stamp_forecasts" (
        "id" UUID PRIMARY KEY,
        "forecast_number" VARCHAR(64) NOT NULL UNIQUE,
        "organization_id" UUID,
        "facility_id" UUID NOT NULL,
        "goods_category" VARCHAR(128) NOT NULL,
        "start_month" DATE NOT NULL,
        "monthly_plan" JSONB NOT NULL DEFAULT '[]'::jsonb,
        "status" VARCHAR(32) NOT NULL DEFAULT 'DRAFT',
        "submitted_at" TIMESTAMPTZ,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
  })().catch((error) => {
    forecastSchemaReadyPromise = null;
    throw error;
  });

  return forecastSchemaReadyPromise;
}

async function ensureStockEventSchema() {
  if (stockEventSchemaReadyPromise) {
    return stockEventSchemaReadyPromise;
  }

  stockEventSchemaReadyPromise = (async () => {
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "excise_stamp_stock_events" (
        "id" UUID PRIMARY KEY,
        "event_number" VARCHAR(64) NOT NULL UNIQUE,
        "organization_id" UUID,
        "event_type" VARCHAR(32) NOT NULL,
        "status" VARCHAR(32) NOT NULL DEFAULT 'DRAFT',
        "related_stamp_request_id" UUID,
        "source_facility_id" UUID NOT NULL,
        "target_facility_id" UUID,
        "reason_code" VARCHAR(64) NOT NULL,
        "quantity" INTEGER NOT NULL,
        "notes" TEXT,
        "evidence_url" VARCHAR(500),
        "requested_at" TIMESTAMPTZ,
        "approved_at" TIMESTAMPTZ,
        "approved_by_user_id" UUID,
        "completed_at" TIMESTAMPTZ,
        "rejection_reason" TEXT,
        "meta" JSONB NOT NULL DEFAULT '{}'::jsonb,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
  })().catch((error) => {
    stockEventSchemaReadyPromise = null;
    throw error;
  });

  return stockEventSchemaReadyPromise;
}

async function ensureVerificationSchema() {
  if (verificationSchemaReadyPromise) {
    return verificationSchemaReadyPromise;
  }

  verificationSchemaReadyPromise = (async () => {
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "excise_stamp_verifications" (
        "id" UUID PRIMARY KEY,
        "verification_number" VARCHAR(64) NOT NULL UNIQUE,
        "organization_id" UUID,
        "facility_id" UUID,
        "actor_type" VARCHAR(32) NOT NULL,
        "channel" VARCHAR(32) NOT NULL DEFAULT 'API',
        "result" VARCHAR(32) NOT NULL,
        "stamp_identifier" VARCHAR(256) NOT NULL,
        "product_description" VARCHAR(255),
        "supplier_name" VARCHAR(255),
        "supplier_document_type" VARCHAR(64),
        "supplier_document_number" VARCHAR(128),
        "verification_evidence" JSONB NOT NULL DEFAULT '{}'::jsonb,
        "remarks" TEXT,
        "verified_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
  })().catch((error) => {
    verificationSchemaReadyPromise = null;
    throw error;
  });

  return verificationSchemaReadyPromise;
}

async function allocateUniqueReference(Model, fieldName, prefix) {
  const year = new Date().getUTCFullYear();
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const suffix = randomBytes(4).toString('hex').toUpperCase();
    const ref = `${prefix}-${year}-${suffix}`;
    const existing = await Model.findOne({ where: { [fieldName]: ref } });
    if (!existing) {
      return ref;
    }
  }
  throw new HttpError(
    500,
    'SERVER_ERROR',
    `Could not allocate ${fieldName} after multiple retries`,
  );
}

function ensureStatusTransition(currentStatus, nextStatus, transitionMap, entityName) {
  if (currentStatus === nextStatus) return;
  const allowed = transitionMap[currentStatus] || [];
  if (!allowed.includes(nextStatus)) {
    throw new HttpError(
      400,
      'INVALID_STATUS_TRANSITION',
      `Cannot move ${entityName} from ${currentStatus} to ${nextStatus}`,
    );
  }
}

export class ExciseCommandService {
  /**
   * @param {{
   *  facilityRepository: import('../../repository/facility.repository.js').ExciseFacilityRepository;
   *  deliveryNoteRepository: import('../../repository/delivery-note.repository.js').ExciseDeliveryNoteRepository;
   *  stampRequestRepository: import('../../repository/stamp-request.repository.js').ExciseStampRequestRepository;
   *  forecastRepository: import('../../repository/forecast.repository.js').ExciseStampForecastRepository;
   *  stockEventRepository: import('../../repository/stamp-stock-event.repository.js').ExciseStampStockEventRepository;
   *  verificationRepository: import('../../repository/stamp-verification.repository.js').ExciseStampVerificationRepository;
   *  configRepository: import('../../repository/config.repository.js').ExciseConfigRepository;
   * }} deps
   */
  constructor({
    facilityRepository,
    deliveryNoteRepository,
    stampRequestRepository,
    forecastRepository,
    stockEventRepository,
    verificationRepository,
    configRepository,
  }) {
    this.facilityRepository = facilityRepository;
    this.deliveryNoteRepository = deliveryNoteRepository;
    this.stampRequestRepository = stampRequestRepository;
    this.forecastRepository = forecastRepository;
    this.stockEventRepository = stockEventRepository;
    this.verificationRepository = verificationRepository;
    this.configRepository = configRepository;
  }

  getDefaultConfigValue(key) {
    return EXCISE_DEFAULT_CONFIGS[key]?.value;
  }

  normalizeConfigKey(keyText) {
    return String(keyText || '')
      .trim()
      .toUpperCase();
  }

  normalizeUppercaseStringArray(values = []) {
    return [...new Set(values.map((x) => String(x || '').trim().toUpperCase()).filter(Boolean))];
  }

  sanitizeConfigValue(key, value) {
    if (value === undefined) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'value is required');
    }
    if (
      key === EXCISE_CONFIG_KEYS.STAMP_REQUEST_MIN_LEAD_TIME ||
      key === EXCISE_CONFIG_KEYS.STAMP_REQUEST_MIN_LEAD_DAYS ||
      key === EXCISE_CONFIG_KEYS.TAX_AUTHORITY_REVIEW_SLA_WORKING_DAYS
    ) {
      const parsed = Number(value);
      if (!Number.isInteger(parsed) || parsed <= 0) {
        throw new HttpError(400, 'VALIDATION_ERROR', `${key} must be a positive integer`);
      }
      return parsed;
    }
    if (
      key === EXCISE_CONFIG_KEYS.ELIGIBLE_EXCISE_CATEGORY_CODES ||
      key === EXCISE_CONFIG_KEYS.ELIGIBLE_EXCISE_PRODUCT_TYPES
    ) {
      if (!Array.isArray(value)) {
        throw new HttpError(400, 'VALIDATION_ERROR', `${key} must be an array of strings`);
      }
      const normalized = this.normalizeUppercaseStringArray(value);
      if (normalized.length === 0) {
        throw new HttpError(400, 'VALIDATION_ERROR', `${key} cannot be empty`);
      }
      return normalized;
    }
    return value;
  }

  validateConfigKey(key) {
    if (!Object.values(EXCISE_CONFIG_KEYS).includes(key)) {
      throw new HttpError(400, 'VALIDATION_ERROR', `Unsupported config key: ${key}`);
    }
  }

  getConfigValueByKey = async (req, key) => {
    await ensureExciseConfigSchema();
    const entity = await this.configRepository.findOne(req, { key });
    if (!entity) {
      return this.getDefaultConfigValue(key);
    }
    return entity.value;
  };

  getPositiveIntConfig = async (req, key) => {
    const fallback = Number(this.getDefaultConfigValue(key));
    const raw = await this.getConfigValueByKey(req, key);
    const out = Number(raw);
    if (!Number.isInteger(out) || out <= 0) {
      return fallback;
    }
    return out;
  };

  getUppercaseSetConfig = async (req, key) => {
    const fallback = this.normalizeUppercaseStringArray(this.getDefaultConfigValue(key) || []);
    const raw = await this.getConfigValueByKey(req, key);
    if (!Array.isArray(raw)) {
      return new Set(fallback);
    }
    const normalized = this.normalizeUppercaseStringArray(raw);
    return new Set(normalized.length > 0 ? normalized : fallback);
  };

  getMinLeadDaysConfig = async (req) => {
    const preferred = await this.getPositiveIntConfig(
      req,
      EXCISE_CONFIG_KEYS.STAMP_REQUEST_MIN_LEAD_TIME,
    );
    if (Number.isInteger(preferred) && preferred > 0) {
      return preferred;
    }
    return this.getPositiveIntConfig(req, EXCISE_CONFIG_KEYS.STAMP_REQUEST_MIN_LEAD_DAYS);
  };

  createConfig = async (req, body) => {
    await ensureExciseConfigSchema();
    const key = this.normalizeConfigKey(body.key);
    this.validateConfigKey(key);

    const existing = await this.configRepository.findOne(req, { key });
    if (existing) {
      throw new HttpError(409, 'CONFIG_ALREADY_EXISTS', 'Excise config already exists');
    }

    const created = await this.configRepository.create(req, {
      key,
      value: this.sanitizeConfigValue(key, body.value),
      description: trimOrNull(body.description) || null,
      isEditable: body.isEditable !== undefined ? Boolean(body.isEditable) : true,
    });
    return created;
  };

  updateConfig = async (req, keyText, body) => {
    await ensureExciseConfigSchema();
    const key = this.normalizeConfigKey(keyText);
    this.validateConfigKey(key);

    const current = await this.configRepository.findOne(req, { key });
    if (!current) {
      throw new HttpError(404, 'NOT_FOUND', 'Excise config not found');
    }
    if (!current.isEditable) {
      throw new HttpError(403, 'FORBIDDEN', 'Excise config is not editable');
    }

    const patch = {
      value: this.sanitizeConfigValue(key, body.value),
    };
    if (body.description !== undefined) {
      patch.description = trimOrNull(body.description);
    }
    if (body.isEditable !== undefined) {
      patch.isEditable = Boolean(body.isEditable);
    }

    await this.configRepository.update(req, current.id, patch);
    return this.configRepository.findOne(req, { key });
  };

  deleteConfig = async (req, keyText) => {
    await ensureExciseConfigSchema();
    const key = this.normalizeConfigKey(keyText);
    this.validateConfigKey(key);

    const current = await this.configRepository.findOne(req, { key });
    if (!current) {
      throw new HttpError(404, 'NOT_FOUND', 'Excise config not found');
    }
    if (!current.isEditable) {
      throw new HttpError(403, 'FORBIDDEN', 'Excise config is not editable');
    }

    await this.configRepository.delete(req, current.id);
    return { message: 'Excise config deleted successfully' };
  };

  createFacility = async (req, body) => {
    const payload = {
      code: await allocateUniqueReference(
        this.facilityRepository.getModel(),
        'code',
        'FAC',
      ),
      name: trimOrNull(body.name),
      facilityType: trimOrNull(body.facilityType),
      licenseNumber: trimOrNull(body.licenseNumber),
      region: trimOrNull(body.region),
      zone: trimOrNull(body.zone),
      woreda: trimOrNull(body.woreda),
      city: trimOrNull(body.city),
      addressLine1: trimOrNull(body.addressLine1),
      addressLine2: trimOrNull(body.addressLine2),
      isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
    };

    if (!payload.name) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'name is required');
    }
    if (!Object.values(FACILITY_TYPES).includes(payload.facilityType)) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'facilityType is invalid');
    }
    if (!payload.addressLine1) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'addressLine1 is required');
    }

    const existing = await this.facilityRepository.findOne(
      req,
      {
        name: payload.name,
        facilityType: payload.facilityType,
      },
      { attributes: ['id'] },
    );
    if (existing) {
      throw new HttpError(
        409,
        'FACILITY_ALREADY_EXISTS',
        'A facility with this name and type already exists',
      );
    }

    const created = await this.facilityRepository.create(req, payload);
    return FacilityResponse.toResponse(
      await this.facilityRepository.findByIdDetailed(req, created.id),
    );
  };

  updateFacility = async (req, id, body) => {
    const current = await this.facilityRepository.findByIdDetailed(req, id);
    if (!current) {
      throw new HttpError(404, 'NOT_FOUND', 'Facility not found');
    }

    const patch = {
      name: trimOrNull(body.name),
      facilityType: trimOrNull(body.facilityType),
      licenseNumber: trimOrNull(body.licenseNumber),
      region: trimOrNull(body.region),
      zone: trimOrNull(body.zone),
      woreda: trimOrNull(body.woreda),
      city: trimOrNull(body.city),
      addressLine1: trimOrNull(body.addressLine1),
      addressLine2: trimOrNull(body.addressLine2),
      isActive: body.isActive !== undefined ? Boolean(body.isActive) : undefined,
    };

    if (patch.facilityType && !Object.values(FACILITY_TYPES).includes(patch.facilityType)) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'facilityType is invalid');
    }

    const updated = await this.facilityRepository.update(req, id, patch);
    if (!updated) {
      throw new HttpError(404, 'NOT_FOUND', 'Facility not found');
    }
    return FacilityResponse.toResponse(
      await this.facilityRepository.findByIdDetailed(req, id),
    );
  };

  createDeliveryNote = async (req, body) => {
    if (!Array.isArray(body.items) || body.items.length === 0) {
      throw new HttpError(
        400,
        'VALIDATION_ERROR',
        'Delivery note requires at least one item',
      );
    }

    const fromFacility = await this.facilityRepository.findByIdDetailed(
      req,
      body.fromFacilityId,
    );
    const toFacility = await this.facilityRepository.findByIdDetailed(
      req,
      body.toFacilityId,
    );
    if (!fromFacility || !toFacility) {
      throw new HttpError(
        404,
        'NOT_FOUND',
        'Source and destination facilities must exist',
      );
    }
    if (fromFacility.id === toFacility.id) {
      throw new HttpError(
        400,
        'VALIDATION_ERROR',
        'fromFacilityId and toFacilityId cannot be the same',
      );
    }

    const expectedDispatchAt = ensureFutureDate(
      body.expectedDispatchAt,
      'expectedDispatchAt',
    );
    const expectedArrivalAt = body.expectedArrivalAt
      ? ensureFutureDate(body.expectedArrivalAt, 'expectedArrivalAt')
      : null;
    if (expectedArrivalAt && expectedArrivalAt < expectedDispatchAt) {
      throw new HttpError(
        400,
        'VALIDATION_ERROR',
        'expectedArrivalAt cannot be earlier than expectedDispatchAt',
      );
    }

    const payload = {
      noteNumber: await allocateUniqueReference(
        this.deliveryNoteRepository.getModel(),
        'noteNumber',
        'DN',
      ),
      fromFacilityId: fromFacility.id,
      toFacilityId: toFacility.id,
      shipmentRoute: trimOrNull(body.shipmentRoute),
      transporterName: trimOrNull(body.transporterName),
      vehiclePlateNo: trimOrNull(body.vehiclePlateNo),
      expectedDispatchAt,
      expectedArrivalAt,
      status: DELIVERY_NOTE_STATUS.DRAFT,
      items: body.items,
      remarks: trimOrNull(body.remarks),
    };

    const created = await this.deliveryNoteRepository.create(req, payload);
    return DeliveryNoteResponse.toResponse(
      await this.deliveryNoteRepository.findByIdDetailed(req, created.id),
    );
  };

  updateDeliveryNoteStatus = async (req, id, body) => {
    const current = await this.deliveryNoteRepository.findByIdDetailed(req, id);
    if (!current) {
      throw new HttpError(404, 'NOT_FOUND', 'Delivery note not found');
    }

    const nextStatus = trimOrNull(body.status);
    if (!Object.values(DELIVERY_NOTE_STATUS).includes(nextStatus)) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'status is invalid');
    }

    ensureStatusTransition(
      current.status,
      nextStatus,
      DELIVERY_NOTE_TRANSITIONS,
      'delivery note',
    );

    const patch = { status: nextStatus };
    if (nextStatus === DELIVERY_NOTE_STATUS.APPROVED) {
      patch.approvedAt = new Date();
    }
    if (nextStatus === DELIVERY_NOTE_STATUS.DISPATCHED) {
      patch.dispatchedAt = new Date();
    }
    if (nextStatus === DELIVERY_NOTE_STATUS.RECEIVED) {
      patch.receivedAt = new Date();
    }

    await this.deliveryNoteRepository.update(req, id, patch);
    return DeliveryNoteResponse.toResponse(
      await this.deliveryNoteRepository.findByIdDetailed(req, id),
    );
  };

  createStampRequest = async (req, body) => {
    await ensureStampRequestSchema();
    await ensureExciseConfigSchema();
    const facility = await this.facilityRepository.findByIdDetailed(req, body.facilityId);
    if (!facility) {
      throw new HttpError(404, 'NOT_FOUND', 'Facility not found');
    }

    const requiredByDate = ensureFutureDate(body.requiredByDate, 'requiredByDate');
    const plannedProductionOrImportDate = ensureFutureDate(
      body.plannedProductionOrImportDate,
      'plannedProductionOrImportDate',
    );

    const now = new Date();
    const minLeadDays = await this.getMinLeadDaysConfig(req);
    const leadTimeMs = requiredByDate.getTime() - now.getTime();
    const minimumLeadTimeMs = minLeadDays * 24 * 60 * 60 * 1000;
    if (leadTimeMs < minimumLeadTimeMs) {
      throw new HttpError(
        400,
        'STAMP_REQUEST_MIN_LEAD_TIME',
        `requiredByDate must be at least ${minLeadDays} days from now`,
      );
    }
    const plannedLeadTimeMs = plannedProductionOrImportDate.getTime() - now.getTime();
    if (plannedLeadTimeMs < minimumLeadTimeMs) {
      throw new HttpError(
        400,
        'STAMP_REQUEST_MIN_LEAD_TIME',
        `plannedProductionOrImportDate must be at least ${minLeadDays} days from now`,
      );
    }
    if (requiredByDate.getTime() > plannedProductionOrImportDate.getTime()) {
      throw new HttpError(
        400,
        'VALIDATION_ERROR',
        'requiredByDate cannot be later than plannedProductionOrImportDate',
      );
    }

    const quantity = Number(body.quantity);
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'quantity must be a positive integer');
    }

    const product = await models.Product.findByPk(body.productId, {
      attributes: ['id', 'name', 'categoryId', 'productTypeId', 'measurementId'],
      include: [
        { model: models.Category, as: 'category', attributes: ['id', 'name', 'code'] },
        { model: models.ProductType, as: 'productType', attributes: ['id', 'name'] },
        { model: models.Measurement, as: 'measurement', attributes: ['id', 'name', 'shortForm'] },
      ],
    });
    if (!product) {
      throw new HttpError(404, 'NOT_FOUND', 'Product not found');
    }

    const variant = await models.ProductVariant.findByPk(body.variantId, {
      attributes: ['id', 'productId', 'name', 'sku', 'unitValue'],
    });
    if (!variant) {
      throw new HttpError(404, 'NOT_FOUND', 'Variant not found');
    }
    if (variant.productId !== product.id) {
      throw new HttpError(
        400,
        'VALIDATION_ERROR',
        'variantId does not belong to the provided productId',
      );
    }

    const productName = trimOrNull(product.name);
    const variantName = trimOrNull(variant.name);
    const uomId = product.measurement?.id ?? null;
    const uomName = trimOrNull(product.measurement?.shortForm || product.measurement?.name);
    const productCategoryCode = trimOrNull(product.category?.code);
    const productTypeNameNormalized = String(product.productType?.name || '')
      .trim()
      .toUpperCase();
    const eligibleCategoryCodes = await this.getUppercaseSetConfig(
      req,
      EXCISE_CONFIG_KEYS.ELIGIBLE_EXCISE_CATEGORY_CODES,
    );
    if (
      !productCategoryCode ||
      !eligibleCategoryCodes.has(String(productCategoryCode).toUpperCase())
    ) {
      throw new HttpError(
        400,
        'PRODUCT_NOT_EXCISABLE',
        'Selected product category is not eligible for excise stamp requests',
      );
    }
    const eligibleProductTypes = await this.getUppercaseSetConfig(
      req,
      EXCISE_CONFIG_KEYS.ELIGIBLE_EXCISE_PRODUCT_TYPES,
    );
    if (!eligibleProductTypes.has(productTypeNameNormalized)) {
      throw new HttpError(
        400,
        'PRODUCT_TYPE_NOT_ELIGIBLE',
        'Selected product type is not eligible for excise stamp requests',
      );
    }
    const derivedGoodsCategory = trimOrNull(body.goodsCategory) || trimOrNull(product.category?.name);
    const derivedGoodsDescription =
      trimOrNull(body.goodsDescription) ||
      [productName, variantName].filter(Boolean).join(' - ');

    const payload = {
      requestNumber: await allocateUniqueReference(
        this.stampRequestRepository.getModel(),
        'requestNumber',
        'STP',
      ),
      facilityId: facility.id,
      productId: product.id,
      productName,
      variantId: variant.id,
      variantName,
      uomId,
      uomName,
      goodsCategory: derivedGoodsCategory,
      goodsDescription: derivedGoodsDescription,
      quantity,
      stampFeeAmount: null,
      stampFeeCurrency: 'ETB',
      paymentStatus: STAMP_PAYMENT_STATUS.UNPAID,
      paymentReference: null,
      paymentProofUrl: null,
      paidAt: null,
      requiredByDate,
      plannedProductionOrImportDate,
      status: STAMP_REQUEST_STATUS.DRAFT,
      attachmentUrl: trimOrNull(body.attachmentUrl),
      submittedAt: null,
      reviewDueAt: null,
      reviewedAt: null,
      reviewedByUserId: null,
      reviewSlaBreached: false,
    };

    if (!payload.goodsCategory || !payload.goodsDescription) {
      throw new HttpError(
        400,
        'VALIDATION_ERROR',
        'goodsCategory and goodsDescription are required (directly or derivable from product)',
      );
    }

    const created = await this.stampRequestRepository.create(req, payload);
    return StampRequestResponse.toResponse(
      await this.stampRequestRepository.findByIdDetailed(req, created.id),
    );
  };

  updateStampRequestPayment = async (req, id, body) => {
    await ensureStampRequestSchema();
    const current = await this.stampRequestRepository.findByIdDetailed(req, id);
    if (!current) {
      throw new HttpError(404, 'NOT_FOUND', 'Stamp request not found');
    }

    if (
      ![STAMP_REQUEST_STATUS.DRAFT, STAMP_REQUEST_STATUS.SUBMITTED].includes(
        current.status,
      )
    ) {
      throw new HttpError(
        400,
        'INVALID_STATE',
        'Payment can only be updated while request is DRAFT or SUBMITTED',
      );
    }

    const amountRaw = body.stampFeeAmount;
    const amount = amountRaw !== undefined ? Number(amountRaw) : null;
    if (amount !== null && (!Number.isFinite(amount) || amount < 0)) {
      throw new HttpError(
        400,
        'VALIDATION_ERROR',
        'stampFeeAmount must be a non-negative number',
      );
    }

    const patch = {
      stampFeeAmount: amount,
      stampFeeCurrency: trimOrNull(body.stampFeeCurrency) || 'ETB',
      paymentReference: trimOrNull(body.paymentReference),
      paymentProofUrl: trimOrNull(body.paymentProofUrl),
      paidAt: body.paidAt ? ensureFutureDate(body.paidAt, 'paidAt') : new Date(),
      paymentStatus: STAMP_PAYMENT_STATUS.PAID,
    };

    if (!patch.paymentReference || !patch.paymentProofUrl) {
      throw new HttpError(
        400,
        'VALIDATION_ERROR',
        'paymentReference and paymentProofUrl are required',
      );
    }

    await this.stampRequestRepository.update(req, id, patch);
    return StampRequestResponse.toResponse(
      await this.stampRequestRepository.findByIdDetailed(req, id),
    );
  };

  submitStampRequest = async (req, id) => {
    await ensureStampRequestSchema();
    await ensureExciseConfigSchema();
    const current = await this.stampRequestRepository.findByIdDetailed(req, id);
    if (!current) {
      throw new HttpError(404, 'NOT_FOUND', 'Stamp request not found');
    }
    if (current.status !== STAMP_REQUEST_STATUS.DRAFT) {
      throw new HttpError(
        400,
        'INVALID_STATE',
        'Only DRAFT stamp requests can be submitted',
      );
    }
    if (current.paymentStatus === STAMP_PAYMENT_STATUS.UNPAID) {
      throw new HttpError(
        400,
        'PAYMENT_REQUIRED',
        'Stamp request payment must be recorded before submission',
      );
    }

    const submittedAt = new Date();
    const reviewSlaDays = await this.getPositiveIntConfig(
      req,
      EXCISE_CONFIG_KEYS.TAX_AUTHORITY_REVIEW_SLA_WORKING_DAYS,
    );
    const reviewDueAt = addWorkingDays(
      submittedAt,
      reviewSlaDays,
    );
    await this.stampRequestRepository.update(req, id, {
      status: STAMP_REQUEST_STATUS.SUBMITTED,
      submittedAt,
      reviewDueAt,
      rejectionReason: null,
    });

    return StampRequestResponse.toResponse(
      await this.stampRequestRepository.findByIdDetailed(req, id),
    );
  };

  reviewStampRequest = async (req, id, body) => {
    await ensureStampRequestSchema();
    const current = await this.stampRequestRepository.findByIdDetailed(req, id);
    if (!current) {
      throw new HttpError(404, 'NOT_FOUND', 'Stamp request not found');
    }
    if (current.status !== STAMP_REQUEST_STATUS.SUBMITTED) {
      throw new HttpError(
        400,
        'INVALID_STATE',
        'Only SUBMITTED stamp requests can be reviewed',
      );
    }

    const decision = trimOrNull(body.decision);
    if (
      ![STAMP_REQUEST_STATUS.APPROVED, STAMP_REQUEST_STATUS.REJECTED].includes(
        decision,
      )
    ) {
      throw new HttpError(
        400,
        'VALIDATION_ERROR',
        'decision must be APPROVED or REJECTED',
      );
    }

    const reviewer = getUser(req);
    const reviewedAt = new Date();
    const dueDate = current.reviewDueAt ? new Date(current.reviewDueAt) : null;
    const patch = {
      status: decision,
      reviewedAt,
      reviewedByUserId: reviewer?.userId ?? null,
      reviewSlaBreached: dueDate ? reviewedAt.getTime() > dueDate.getTime() : false,
      rejectionReason:
        decision === STAMP_REQUEST_STATUS.REJECTED
          ? trimOrNull(body.rejectionReason)
          : null,
    };

    if (decision === STAMP_REQUEST_STATUS.REJECTED && !patch.rejectionReason) {
      throw new HttpError(
        400,
        'VALIDATION_ERROR',
        'rejectionReason is required when decision is REJECTED',
      );
    }

    if (decision === STAMP_REQUEST_STATUS.APPROVED) {
      patch.approvedAt = reviewedAt;
      if (current.paymentStatus === STAMP_PAYMENT_STATUS.PAID) {
        patch.paymentStatus = STAMP_PAYMENT_STATUS.VERIFIED;
      }
    }

    await this.stampRequestRepository.update(req, id, patch);
    return StampRequestResponse.toResponse(
      await this.stampRequestRepository.findByIdDetailed(req, id),
    );
  };

  fulfillStampRequest = async (req, id) => {
    await ensureStampRequestSchema();
    const current = await this.stampRequestRepository.findByIdDetailed(req, id);
    if (!current) {
      throw new HttpError(404, 'NOT_FOUND', 'Stamp request not found');
    }

    ensureStatusTransition(
      current.status,
      STAMP_REQUEST_STATUS.FULFILLED,
      STAMP_REQUEST_TRANSITIONS,
      'stamp request',
    );

    await this.stampRequestRepository.update(req, id, {
      status: STAMP_REQUEST_STATUS.FULFILLED,
      fulfilledAt: new Date(),
    });
    return StampRequestResponse.toResponse(
      await this.stampRequestRepository.findByIdDetailed(req, id),
    );
  };

  createForecast = async (req, body) => {
    await ensureForecastSchema();
    const facility = await this.facilityRepository.findByIdDetailed(req, body.facilityId);
    if (!facility) {
      throw new HttpError(404, 'NOT_FOUND', 'Facility not found');
    }

    const goodsCategory = trimOrNull(body.goodsCategory);
    if (!goodsCategory) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'goodsCategory is required');
    }

    const normalized = normalizeMonthlyPlan(body.monthlyPlan);
    const payload = {
      forecastNumber: await allocateUniqueReference(
        this.forecastRepository.getModel(),
        'forecastNumber',
        'FCST',
      ),
      facilityId: facility.id,
      goodsCategory,
      startMonth: monthKey(normalized.startMonthDate),
      monthlyPlan: normalized.monthlyPlan,
      status: FORECAST_STATUS.DRAFT,
      submittedAt: null,
    };

    const created = await this.forecastRepository.create(req, payload);
    return ForecastResponse.toResponse(
      await this.forecastRepository.findByIdDetailed(req, created.id),
    );
  };

  updateForecast = async (req, id, body) => {
    await ensureForecastSchema();
    const current = await this.forecastRepository.findByIdDetailed(req, id);
    if (!current) {
      throw new HttpError(404, 'NOT_FOUND', 'Forecast not found');
    }
    if (current.status !== FORECAST_STATUS.DRAFT) {
      throw new HttpError(
        400,
        'INVALID_STATE',
        'Only DRAFT forecasts can be updated',
      );
    }

    const patch = {};
    if (body.goodsCategory !== undefined) {
      const goodsCategory = trimOrNull(body.goodsCategory);
      if (!goodsCategory) {
        throw new HttpError(400, 'VALIDATION_ERROR', 'goodsCategory cannot be empty');
      }
      patch.goodsCategory = goodsCategory;
    }
    if (body.monthlyPlan !== undefined) {
      const normalized = normalizeMonthlyPlan(body.monthlyPlan);
      patch.startMonth = monthKey(normalized.startMonthDate);
      patch.monthlyPlan = normalized.monthlyPlan;
    }

    if (Object.keys(patch).length === 0) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'No changes provided');
    }

    await this.forecastRepository.update(req, id, patch);
    return ForecastResponse.toResponse(
      await this.forecastRepository.findByIdDetailed(req, id),
    );
  };

  submitForecast = async (req, id) => {
    await ensureForecastSchema();
    await ensureExciseConfigSchema();
    const current = await this.forecastRepository.findByIdDetailed(req, id);
    if (!current) {
      throw new HttpError(404, 'NOT_FOUND', 'Forecast not found');
    }
    if (current.status !== FORECAST_STATUS.DRAFT) {
      throw new HttpError(
        400,
        'INVALID_STATE',
        'Only DRAFT forecasts can be submitted',
      );
    }

    const startMonth = parseMonthString(current.startMonth, 'startMonth');
    const now = new Date();
    const dayDiff = Math.floor(
      (startMonth.getTime() - toUtcMonthStart(now).getTime()) / (24 * 60 * 60 * 1000),
    );
    const minLeadDays = await this.getMinLeadDaysConfig(req);
    if (dayDiff < minLeadDays) {
      throw new HttpError(
        400,
        'FORECAST_MIN_LEAD_TIME',
        `Forecast must be submitted at least ${minLeadDays} days before first forecast month`,
      );
    }

    await this.forecastRepository.update(req, id, {
      status: FORECAST_STATUS.SUBMITTED,
      submittedAt: new Date(),
    });
    return ForecastResponse.toResponse(
      await this.forecastRepository.findByIdDetailed(req, id),
    );
  };

  createStockEvent = async (req, body) => {
    await ensureStockEventSchema();
    const eventType = trimOrNull(body.eventType);
    if (!Object.values(STAMP_STOCK_EVENT_TYPE).includes(eventType)) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'eventType is invalid');
    }

    const sourceFacility = await this.facilityRepository.findByIdDetailed(
      req,
      body.sourceFacilityId,
    );
    if (!sourceFacility) {
      throw new HttpError(404, 'NOT_FOUND', 'sourceFacilityId not found');
    }

    let targetFacility = null;
    if (body.targetFacilityId) {
      targetFacility = await this.facilityRepository.findByIdDetailed(
        req,
        body.targetFacilityId,
      );
      if (!targetFacility) {
        throw new HttpError(404, 'NOT_FOUND', 'targetFacilityId not found');
      }
    }

    const quantity = ensurePositiveInteger(body.quantity, 'quantity');
    const reasonCode = trimOrNull(body.reasonCode);
    if (!reasonCode) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'reasonCode is required');
    }

    if (eventType === STAMP_STOCK_EVENT_TYPE.RETURN) {
      if (!Object.values(STAMP_RETURN_REASON).includes(reasonCode)) {
        throw new HttpError(400, 'VALIDATION_ERROR', 'reasonCode is invalid for RETURN');
      }
    }
    if (eventType === STAMP_STOCK_EVENT_TYPE.WASTAGE) {
      if (!Object.values(STAMP_WASTAGE_REASON).includes(reasonCode)) {
        throw new HttpError(400, 'VALIDATION_ERROR', 'reasonCode is invalid for WASTAGE');
      }
    }
    if (eventType === STAMP_STOCK_EVENT_TYPE.TRANSFER) {
      if (!Object.values(STAMP_TRANSFER_REASON).includes(reasonCode)) {
        throw new HttpError(400, 'VALIDATION_ERROR', 'reasonCode is invalid for TRANSFER');
      }
      if (!targetFacility) {
        throw new HttpError(
          400,
          'VALIDATION_ERROR',
          'targetFacilityId is required for TRANSFER',
        );
      }
      if (targetFacility.id === sourceFacility.id) {
        throw new HttpError(
          400,
          'VALIDATION_ERROR',
          'sourceFacilityId and targetFacilityId cannot be the same',
        );
      }
    }

    let relatedStampRequest = null;
    if (body.relatedStampRequestId) {
      relatedStampRequest = await this.stampRequestRepository.findByIdDetailed(
        req,
        body.relatedStampRequestId,
      );
      if (!relatedStampRequest) {
        throw new HttpError(404, 'NOT_FOUND', 'relatedStampRequestId not found');
      }
    }

    if (eventType === STAMP_STOCK_EVENT_TYPE.WASTAGE && relatedStampRequest) {
      const maxAllowed = Math.max(1, Math.floor(Number(relatedStampRequest.quantity) * 0.01));
      if (quantity > maxAllowed) {
        throw new HttpError(
          400,
          'WASTAGE_EXCEEDS_THRESHOLD',
          `Wastage quantity exceeds 1% threshold for related request (max ${maxAllowed})`,
        );
      }
    }

    const created = await this.stockEventRepository.create(req, {
      eventNumber: await allocateUniqueReference(
        this.stockEventRepository.getModel(),
        'eventNumber',
        'STKEVT',
      ),
      eventType,
      status: STAMP_STOCK_EVENT_STATUS.DRAFT,
      relatedStampRequestId: relatedStampRequest?.id ?? null,
      sourceFacilityId: sourceFacility.id,
      targetFacilityId: targetFacility?.id ?? null,
      reasonCode,
      quantity,
      notes: trimOrNull(body.notes),
      evidenceUrl: trimOrNull(body.evidenceUrl),
      meta:
        body.meta && typeof body.meta === 'object' && !Array.isArray(body.meta)
          ? body.meta
          : {},
    });

    return StampStockEventResponse.toResponse(
      await this.stockEventRepository.findByIdDetailed(req, created.id),
    );
  };

  submitStockEvent = async (req, id) => {
    await ensureStockEventSchema();
    const current = await this.stockEventRepository.findByIdDetailed(req, id);
    if (!current) {
      throw new HttpError(404, 'NOT_FOUND', 'Stock event not found');
    }

    ensureStatusTransition(
      current.status,
      STAMP_STOCK_EVENT_STATUS.SUBMITTED,
      STOCK_EVENT_TRANSITIONS,
      'stock event',
    );

    await this.stockEventRepository.update(req, id, {
      status: STAMP_STOCK_EVENT_STATUS.SUBMITTED,
      requestedAt: new Date(),
      rejectionReason: null,
    });
    return StampStockEventResponse.toResponse(
      await this.stockEventRepository.findByIdDetailed(req, id),
    );
  };

  reviewStockEvent = async (req, id, body) => {
    await ensureStockEventSchema();
    const current = await this.stockEventRepository.findByIdDetailed(req, id);
    if (!current) {
      throw new HttpError(404, 'NOT_FOUND', 'Stock event not found');
    }
    if (current.status !== STAMP_STOCK_EVENT_STATUS.SUBMITTED) {
      throw new HttpError(
        400,
        'INVALID_STATE',
        'Only SUBMITTED stock events can be reviewed',
      );
    }

    const decision = trimOrNull(body.decision);
    if (
      ![STAMP_STOCK_EVENT_STATUS.APPROVED, STAMP_STOCK_EVENT_STATUS.REJECTED].includes(
        decision,
      )
    ) {
      throw new HttpError(
        400,
        'VALIDATION_ERROR',
        'decision must be APPROVED or REJECTED',
      );
    }

    const reviewer = getUser(req);
    const patch = {
      status: decision,
      approvedAt: decision === STAMP_STOCK_EVENT_STATUS.APPROVED ? new Date() : null,
      approvedByUserId: reviewer?.userId ?? null,
      rejectionReason:
        decision === STAMP_STOCK_EVENT_STATUS.REJECTED
          ? trimOrNull(body.rejectionReason)
          : null,
    };
    if (decision === STAMP_STOCK_EVENT_STATUS.REJECTED && !patch.rejectionReason) {
      throw new HttpError(
        400,
        'VALIDATION_ERROR',
        'rejectionReason is required when decision is REJECTED',
      );
    }

    await this.stockEventRepository.update(req, id, patch);
    return StampStockEventResponse.toResponse(
      await this.stockEventRepository.findByIdDetailed(req, id),
    );
  };

  completeStockEvent = async (req, id) => {
    await ensureStockEventSchema();
    const current = await this.stockEventRepository.findByIdDetailed(req, id);
    if (!current) {
      throw new HttpError(404, 'NOT_FOUND', 'Stock event not found');
    }

    ensureStatusTransition(
      current.status,
      STAMP_STOCK_EVENT_STATUS.COMPLETED,
      STOCK_EVENT_TRANSITIONS,
      'stock event',
    );

    await this.stockEventRepository.update(req, id, {
      status: STAMP_STOCK_EVENT_STATUS.COMPLETED,
      completedAt: new Date(),
    });
    return StampStockEventResponse.toResponse(
      await this.stockEventRepository.findByIdDetailed(req, id),
    );
  };

  createStampVerification = async (req, body, { isPublic = false } = {}) => {
    await ensureVerificationSchema();
    const actorType = trimOrNull(body.actorType);
    const channel = trimOrNull(body.channel) || STAMP_VERIFICATION_CHANNEL.API;
    const result = trimOrNull(body.result);

    if (!Object.values(STAMP_VERIFICATION_ACTOR_TYPE).includes(actorType)) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'actorType is invalid');
    }
    if (!Object.values(STAMP_VERIFICATION_CHANNEL).includes(channel)) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'channel is invalid');
    }
    if (!Object.values(STAMP_VERIFICATION_RESULT).includes(result)) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'result is invalid');
    }

    if (isPublic && actorType !== STAMP_VERIFICATION_ACTOR_TYPE.PUBLIC) {
      throw new HttpError(
        400,
        'VALIDATION_ERROR',
        'Public verification must use actorType PUBLIC',
      );
    }
    if (!isPublic && actorType === STAMP_VERIFICATION_ACTOR_TYPE.PUBLIC) {
      throw new HttpError(
        400,
        'VALIDATION_ERROR',
        'Use public endpoint for actorType PUBLIC',
      );
    }

    const stampIdentifier = trimOrNull(body.stampIdentifier);
    if (!stampIdentifier) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'stampIdentifier is required');
    }

    let facility = null;
    if (body.facilityId) {
      facility = await this.facilityRepository.findByIdDetailed(req, body.facilityId);
      if (!facility) {
        throw new HttpError(404, 'NOT_FOUND', 'facilityId not found');
      }
    }

    const supplierDocumentType = trimOrNull(body.supplierDocumentType);
    const supplierDocumentNumber = trimOrNull(body.supplierDocumentNumber);
    const supplierName = trimOrNull(body.supplierName);
    if (!isPublic) {
      if (!supplierDocumentType || !supplierDocumentNumber) {
        throw new HttpError(
          400,
          'VALIDATION_ERROR',
          'supplierDocumentType and supplierDocumentNumber are required for operator verification',
        );
      }
    }

    const created = await this.verificationRepository.create(req, {
      verificationNumber: await allocateUniqueReference(
        this.verificationRepository.getModel(),
        'verificationNumber',
        'VER',
      ),
      facilityId: facility?.id ?? null,
      actorType,
      channel,
      result,
      stampIdentifier,
      productDescription: trimOrNull(body.productDescription),
      supplierName,
      supplierDocumentType,
      supplierDocumentNumber,
      verificationEvidence:
        body.verificationEvidence &&
        typeof body.verificationEvidence === 'object' &&
        !Array.isArray(body.verificationEvidence)
          ? body.verificationEvidence
          : {},
      remarks: trimOrNull(body.remarks),
      verifiedAt: body.verifiedAt
        ? ensureFutureDate(body.verifiedAt, 'verifiedAt')
        : new Date(),
    });

    return StampVerificationResponse.toResponse(
      await this.verificationRepository.findByIdDetailed(req, created.id),
    );
  };
}
