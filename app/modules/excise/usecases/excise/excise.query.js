import { HttpError } from '../../../../shared/utils/http-error.js';
import { Op } from 'sequelize';
import { sequelize } from '../../../../shared/db/database.js';
import { models } from '../../../../shared/db/data-source.js';
import {
  STAMP_REQUEST_STATUS,
  STAMP_VERIFICATION_RESULT,
} from '../../constants/excise.enums.js';
import { mapExciseDataResponse } from '../_shared/excise-map-response.util.js';
import { DeliveryNoteResponse } from '../delivery-note/delivery-note.response.js';
import { FacilityResponse } from '../facility/facility.response.js';
import { ForecastResponse } from '../forecast/forecast.response.js';
import { StampRequestResponse } from '../stamp-request/stamp-request.response.js';
import { StampStockEventResponse } from '../stamp-stock-event/stamp-stock-event.response.js';
import { StampVerificationResponse } from '../stamp-verification/stamp-verification.response.js';
import { ensureStampRequestSchema } from './ensure-stamp-request-schema.js';
import { ensureExciseConfigSchema } from './ensure-excise-config-schema.js';
import { ExciseConfigResponse } from '../config/config.response.js';

let forecastSchemaReadyPromise = null;
let stockEventSchemaReadyPromise = null;
let verificationSchemaReadyPromise = null;

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

export class ExciseQueryService {
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

  listConfigs = async (req, query) => {
    await ensureExciseConfigSchema();
    const result = await this.configRepository.findAll(
      req,
      {
        order: [['key', 'ASC']],
      },
      query,
    );
    return mapExciseDataResponse(result, ExciseConfigResponse.toResponse);
  };

  getConfigByKey = async (req, key) => {
    await ensureExciseConfigSchema();
    const entity = await this.configRepository.findOne(req, { key });
    if (!entity) {
      throw new HttpError(404, 'NOT_FOUND', 'Excise config not found');
    }
    return ExciseConfigResponse.toResponse(entity);
  };

  listFacilities = async (req, query) => {
    const result = await this.facilityRepository.findAllDetailed(req, query);
    return mapExciseDataResponse(result, FacilityResponse.toResponse);
  };

  getFacilityById = async (req, id) => {
    const entity = await this.facilityRepository.findByIdDetailed(req, id);
    if (!entity) {
      throw new HttpError(404, 'NOT_FOUND', 'Facility not found');
    }
    return FacilityResponse.toResponse(entity);
  };

  listDeliveryNotes = async (req, query) => {
    const result = await this.deliveryNoteRepository.findAllDetailed(req, query);
    return mapExciseDataResponse(result, DeliveryNoteResponse.toResponse);
  };

  getDeliveryNoteById = async (req, id) => {
    const entity = await this.deliveryNoteRepository.findByIdDetailed(req, id);
    if (!entity) {
      throw new HttpError(404, 'NOT_FOUND', 'Delivery note not found');
    }
    return DeliveryNoteResponse.toResponse(entity);
  };

  listStampRequests = async (req, query) => {
    await ensureStampRequestSchema();
    const result = await this.stampRequestRepository.findAllDetailed(req, query);
    return mapExciseDataResponse(result, StampRequestResponse.toResponse);
  };

  listStampRequestSlaBreaches = async (req, query = {}) => {
    await ensureStampRequestSchema();
    const now = new Date();
    const result = await this.stampRequestRepository.findAll(
      req,
      {
        include: [
          {
            model: models.ExciseFacility,
            as: 'facility',
          },
        ],
        order: [['reviewDueAt', 'ASC']],
      },
      {
        ...query,
        where: {
          [Op.or]: [
            { reviewSlaBreached: true },
            {
              status: STAMP_REQUEST_STATUS.SUBMITTED,
              reviewDueAt: { [Op.lt]: now },
            },
          ],
        },
      },
    );
    return mapExciseDataResponse(result, StampRequestResponse.toResponse);
  };

  getStampRequestById = async (req, id) => {
    await ensureStampRequestSchema();
    const entity = await this.stampRequestRepository.findByIdDetailed(req, id);
    if (!entity) {
      throw new HttpError(404, 'NOT_FOUND', 'Stamp request not found');
    }
    return StampRequestResponse.toResponse(entity);
  };

  listForecasts = async (req, query) => {
    await ensureForecastSchema();
    const result = await this.forecastRepository.findAllDetailed(req, query);
    return mapExciseDataResponse(result, ForecastResponse.toResponse);
  };

  getForecastById = async (req, id) => {
    await ensureForecastSchema();
    const entity = await this.forecastRepository.findByIdDetailed(req, id);
    if (!entity) {
      throw new HttpError(404, 'NOT_FOUND', 'Forecast not found');
    }
    return ForecastResponse.toResponse(entity);
  };

  listStockEvents = async (req, query) => {
    await ensureStockEventSchema();
    const result = await this.stockEventRepository.findAllDetailed(req, query);
    return mapExciseDataResponse(result, StampStockEventResponse.toResponse);
  };

  getStockEventById = async (req, id) => {
    await ensureStockEventSchema();
    const entity = await this.stockEventRepository.findByIdDetailed(req, id);
    if (!entity) {
      throw new HttpError(404, 'NOT_FOUND', 'Stock event not found');
    }
    return StampStockEventResponse.toResponse(entity);
  };

  listStampVerifications = async (req, query) => {
    await ensureVerificationSchema();
    const result = await this.verificationRepository.findAllDetailed(req, query);
    return mapExciseDataResponse(result, StampVerificationResponse.toResponse);
  };

  getStampVerificationById = async (req, id) => {
    await ensureVerificationSchema();
    const entity = await this.verificationRepository.findByIdDetailed(req, id);
    if (!entity) {
      throw new HttpError(404, 'NOT_FOUND', 'Stamp verification not found');
    }
    return StampVerificationResponse.toResponse(entity);
  };

  getStampVerificationSummary = async (req) => {
    await ensureVerificationSchema();
    const Model = this.verificationRepository.getModel();
    const [authentic, suspect, cancelledUi, notFound] = await Promise.all([
      Model.count({ where: { result: STAMP_VERIFICATION_RESULT.AUTHENTIC } }),
      Model.count({ where: { result: STAMP_VERIFICATION_RESULT.SUSPECT } }),
      Model.count({ where: { result: STAMP_VERIFICATION_RESULT.CANCELLED_UI } }),
      Model.count({ where: { result: STAMP_VERIFICATION_RESULT.NOT_FOUND } }),
    ]);

    const recent = await this.verificationRepository.findAllDetailed(req, {
      limit: 10,
      page: 1,
    });
    const recentMapped = mapExciseDataResponse(
      recent,
      StampVerificationResponse.toResponse,
    );
    const scanned = authentic + suspect + cancelledUi + notFound;
    return {
      totals: {
        scanned,
        authentic,
        suspect,
        cancelledUi,
        notFound,
        total: scanned,
      },
      recent: recentMapped.data || [],
    };
  };

  getAllStampScans = async (req, query = {}) => {
    await ensureVerificationSchema();
    const result = await this.verificationRepository.findAllDetailed(req, query);
    return mapExciseDataResponse(result, StampVerificationResponse.toResponse);
  };
}
