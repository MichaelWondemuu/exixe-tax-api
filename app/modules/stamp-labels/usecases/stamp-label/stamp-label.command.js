import { randomBytes, randomUUID } from 'crypto';
import { HttpError } from '../../../../shared/utils/http-error.js';
import { models } from '../../../../shared/db/data-source.js';
import { STAMP_REQUEST_STATUS } from '../../../excise/constants/excise.enums.js';
import { ensureStampRequestSchema } from '../../../excise/usecases/excise/ensure-stamp-request-schema.js';
import {
  ensureExciseConfigSchema,
  EXCISE_CONFIG_KEYS,
  EXCISE_DEFAULT_CONFIGS,
} from '../../../excise/usecases/excise/ensure-excise-config-schema.js';
import {
  STAMP_LABEL_BATCH_STATUS,
  STAMP_LABEL_ENFORCEMENT_ACTION,
  STAMP_LABEL_CODE_FORMAT,
  STAMP_LABEL_EVENT_TYPE,
  STAMP_LABEL_LIFECYCLE_STATUS,
  STAMP_LABEL_PACKAGE_LEVEL,
  STAMP_LABEL_SECURITY_FEATURE,
  STAMP_LABEL_TEMPLATE_LIFECYCLE_STATUS,
  STAMP_LABEL_TEMPLATE_RESOLVED_BY,
  STAMP_LABEL_VERIFICATION_RESULT,
} from '../../constants/stamp-labels.enums.js';
import { ensureStampLabelSchema } from './stamp-label.schema.js';

const STATUS_FLOW = [
  STAMP_LABEL_LIFECYCLE_STATUS.GENERATED,
  STAMP_LABEL_LIFECYCLE_STATUS.ISSUED,
  STAMP_LABEL_LIFECYCLE_STATUS.ASSIGNED,
  STAMP_LABEL_LIFECYCLE_STATUS.APPLIED,
  STAMP_LABEL_LIFECYCLE_STATUS.ACTIVATED,
  STAMP_LABEL_LIFECYCLE_STATUS.TRACKED,
  STAMP_LABEL_LIFECYCLE_STATUS.VERIFIED,
  STAMP_LABEL_LIFECYCLE_STATUS.AUDITED,
];

function statusRank(status) {
  const index = STATUS_FLOW.indexOf(status);
  return index >= 0 ? index : -1;
}

function buildStampUid(prefix = 'ET-EXS') {
  const datePart = new Date().toISOString().slice(0, 10).replaceAll('-', '');
  const randomPart = randomBytes(6).toString('hex').toUpperCase();
  return `${prefix}-${datePart}-${randomPart}`;
}

function extractActor(req) {
  return {
    actorId:
      req?.accountId ||
      req?.userId ||
      req?.user?.id ||
      req?.headers?.['x-user-id'] ||
      null,
    actorName:
      req?.user?.fullName ||
      req?.user?.name ||
      req?.headers?.['x-user-name'] ||
      null,
  };
}

function ensureLifecycle(currentStatus, allowedStatuses, actionName) {
  if (!allowedStatuses.includes(currentStatus)) {
    throw new HttpError(
      409,
      'STAMP_LIFECYCLE_CONFLICT',
      `Cannot ${actionName} stamp in ${currentStatus} status`,
    );
  }
}

function normalizeBatchNumber(batchNumber) {
  const value = String(batchNumber || '').trim();
  return value.length > 0 ? value : null;
}

function buildBatchNumber(sequence) {
  return `BATCH-${String(sequence).padStart(6, '0')}`;
}

function normalizeTemplateFeatureCodes(features = []) {
  if (!Array.isArray(features)) return [];
  return [...new Set(features.map((f) => String(f || '').trim()).filter(Boolean))];
}

export class StampLabelCommandService {
  /**
   * @param {{
   *  stampLabelRepository: import('../../repository/stamp-label.repository.js').StampLabelRepository;
   *  stampLabelEventRepository: import('../../repository/stamp-label.repository.js').StampLabelEventRepository;
   *  stampLabelTemplateRepository: import('../../repository/stamp-label.repository.js').StampLabelTemplateRepository;
  *  stampLabelBatchRepository: import('../../repository/stamp-label.repository.js').StampLabelBatchRepository;
   * }} deps
   */
  constructor({
    stampLabelRepository,
    stampLabelEventRepository,
    stampLabelTemplateRepository,
    stampLabelBatchRepository,
  }) {
    this.stampLabelRepository = stampLabelRepository;
    this.stampLabelEventRepository = stampLabelEventRepository;
    this.stampLabelTemplateRepository = stampLabelTemplateRepository;
    this.stampLabelBatchRepository = stampLabelBatchRepository;
  }

  async getExciseConfigValue(req, key) {
    await ensureExciseConfigSchema();
    const row = await models.ExciseConfig.findOne({ where: { key } });
    if (row) return row.value;
    return EXCISE_DEFAULT_CONFIGS[key]?.value;
  }

  async ensureOrganizationOperatorFieldsSchema() {
    await models.OrganizationDetail.sequelize.query(`
      ALTER TABLE "organization_details"
      ADD COLUMN IF NOT EXISTS "operator_type" VARCHAR(32),
      ADD COLUMN IF NOT EXISTS "operator_license_number" VARCHAR(128),
      ADD COLUMN IF NOT EXISTS "merchant_id" VARCHAR(128),
      ADD COLUMN IF NOT EXISTS "merchant_name" VARCHAR(255)
    `);
  }

  async getDigitalLinkBaseUrl(req) {
    const raw = await this.getExciseConfigValue(
      req,
      EXCISE_CONFIG_KEYS.STAMP_LABEL_DIGITAL_LINK_BASE_URL,
    );
    const value = String(raw || '').trim();
    if (!value) {
      throw new HttpError(
        400,
        'STAMP_LABEL_CONFIG_MISSING',
        'STAMP_LABEL_DIGITAL_LINK_BASE_URL config is required',
      );
    }
    return value.replace(/\/$/, '');
  }

  async nextBatchNumber() {
    const [rows] = await models.StampLabel.sequelize.query(`
      SELECT COALESCE(
        MAX(
          CASE
            WHEN batch_number ~ '[0-9]+$'
              THEN CAST(regexp_replace(batch_number, '^.*?(\\d+)$', '\\1') AS BIGINT)
            ELSE NULL
          END
        ),
        0
      ) AS max_seq
      FROM stamp_label_batches
    `);
    const maxSeq = Number(rows?.[0]?.max_seq || 0);
    return buildBatchNumber(maxSeq + 1);
  }

  async getBatchOrFail(req, batchNumber) {
    const normalizedBatchNumber = normalizeBatchNumber(batchNumber);
    if (!normalizedBatchNumber) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'batchNumber is required');
    }

    const batch = await this.stampLabelBatchRepository.findByBatchNumber(
      req,
      normalizedBatchNumber,
    );
    if (!batch) {
      throw new HttpError(404, 'NOT_FOUND', 'Batch not found');
    }
    return batch;
  }

  deriveBatchStatus(totalCount, issuedCount, printedCount) {
    if (totalCount <= 0) return STAMP_LABEL_BATCH_STATUS.GENERATED;
    if (printedCount >= totalCount) return STAMP_LABEL_BATCH_STATUS.PRINTED;
    if (printedCount > 0) return STAMP_LABEL_BATCH_STATUS.PARTIAL_PRINTED;
    if (issuedCount <= 0) return STAMP_LABEL_BATCH_STATUS.GENERATED;
    if (issuedCount >= totalCount) return STAMP_LABEL_BATCH_STATUS.ISSUED;
    return STAMP_LABEL_BATCH_STATUS.PARTIAL_ISSUED;
  }

  async refreshBatchFromStamps(req, batchId) {
    if (!batchId) return null;
    const batch = await this.stampLabelBatchRepository.findById(req, batchId);
    if (!batch) return null;

    const stamps = await this.stampLabelRepository.findMany(req, { batchId });
    const totalCount = stamps.length;
    const issuedCount = stamps.filter(
      (stamp) => statusRank(stamp.status) >= statusRank(STAMP_LABEL_LIFECYCLE_STATUS.ISSUED),
    ).length;
    const printedCount = Math.min(Number(batch.printedCount || 0), issuedCount);
    const status = this.deriveBatchStatus(totalCount, issuedCount, printedCount);

    return this.stampLabelBatchRepository.update(req, batch.id, {
      totalCount,
      generatedCount: totalCount,
      issuedCount,
      printedCount,
      status,
    });
  }

  async resolveOrganizationOperatorContext(req, stampRequest, body = {}) {
    await this.ensureOrganizationOperatorFieldsSchema();
    const organizationId = req?.organizationId || stampRequest?.organizationId || null;
    let organization = null;
    if (organizationId) {
      organization = await models.Organization.findByPk(organizationId, {
        attributes: ['id', 'name'],
        include: [
          {
            model: models.OrganizationDetail,
            as: 'detail',
            required: false,
            attributes: [
              'tin',
              'operatorType',
              'operatorLicenseNumber',
              'merchantId',
              'merchantName',
              'legalName',
            ],
          },
        ],
      });
    }

    const detail = organization?.detail || {};
    return {
      organizationId: organization?.id || stampRequest?.organizationId || null,
      operatorType: detail.operatorType || body.operatorType || null,
      operatorName: body.operatorName || detail.legalName || organization?.name || null,
      operatorTin: detail.tin || body.operatorTin || null,
      operatorLicenseNumber:
        detail.operatorLicenseNumber || body.operatorLicenseNumber || null,
      merchantId: detail.merchantId || body.merchantId || null,
      merchantName: detail.merchantName || body.merchantName || organization?.name || null,
    };
  }

  async resolveTemplate(req, stampRequest, body = {}) {
    const whereActive = {
      lifecycleStatus: STAMP_LABEL_TEMPLATE_LIFECYCLE_STATUS.ACTIVE,
    };

    if (body.templateId) {
      const byId = await models.StampLabelTemplate.findByPk(body.templateId, {
        include: [{ model: models.StampLabelTemplateSecurityFeature, as: 'securityFeatures' }],
      });
      if (!byId) {
        throw new HttpError(404, 'NOT_FOUND', 'Template not found');
      }
      return byId;
    }

    if (body.templateCode) {
      const byCode = await models.StampLabelTemplate.findOne({
        where: { ...whereActive, code: body.templateCode },
        include: [{ model: models.StampLabelTemplateSecurityFeature, as: 'securityFeatures' }],
      });
      if (byCode) return byCode;
    }

    const productId = body.productId || stampRequest.productId || null;
    const variantId = body.variantId || stampRequest.variantId || null;
    if (variantId) {
      const byVariant = await models.StampLabelTemplate.findOne({
        where: {
          ...whereActive,
          variantId,
          resolvedBy: STAMP_LABEL_TEMPLATE_RESOLVED_BY.VARIANT,
        },
        include: [{ model: models.StampLabelTemplateSecurityFeature, as: 'securityFeatures' }],
      });
      if (byVariant) return byVariant;
    }
    if (productId) {
      const byProduct = await models.StampLabelTemplate.findOne({
        where: {
          ...whereActive,
          productId,
          resolvedBy: STAMP_LABEL_TEMPLATE_RESOLVED_BY.PRODUCT,
        },
        include: [{ model: models.StampLabelTemplateSecurityFeature, as: 'securityFeatures' }],
      });
      if (byProduct) return byProduct;
      const product = await models.Product.findByPk(productId, { attributes: ['id', 'categoryId'] });
      if (product?.categoryId) {
        const byCategory = await models.StampLabelTemplate.findOne({
          where: {
            ...whereActive,
            categoryId: product.categoryId,
            resolvedBy: STAMP_LABEL_TEMPLATE_RESOLVED_BY.CATEGORY,
          },
          include: [{ model: models.StampLabelTemplateSecurityFeature, as: 'securityFeatures' }],
        });
        if (byCategory) return byCategory;
      }
    }

    return null;
  }

  validateTemplateTargetByResolvedBy(resolvedBy, { productId, variantId, categoryId }) {
    if (resolvedBy === STAMP_LABEL_TEMPLATE_RESOLVED_BY.VARIANT) {
      if (!productId || !variantId) {
        throw new HttpError(
          400,
          'VALIDATION_ERROR',
          'resolvedBy VARIANT requires both productId and variantId',
        );
      }
      return;
    }
    if (resolvedBy === STAMP_LABEL_TEMPLATE_RESOLVED_BY.PRODUCT) {
      if (!productId) {
        throw new HttpError(
          400,
          'VALIDATION_ERROR',
          'resolvedBy PRODUCT requires productId',
        );
      }
      return;
    }
    if (resolvedBy === STAMP_LABEL_TEMPLATE_RESOLVED_BY.CATEGORY) {
      if (!categoryId) {
        throw new HttpError(
          400,
          'VALIDATION_ERROR',
          'resolvedBy CATEGORY requires categoryId',
        );
      }
    }
  }

  async logEvent(req, stamp, eventType, details = {}) {
    const actor = extractActor(req);
    const event = await this.stampLabelEventRepository.create(req, {
      id: randomUUID(),
      stampLabelId: stamp.id,
      stampUid: stamp.stampUid,
      eventType,
      fromStatus: details.fromStatus ?? null,
      toStatus: details.toStatus ?? stamp.status ?? null,
      actorType: details.actorType ?? null,
      actorId: details.actorId ?? actor.actorId,
      actorName: details.actorName ?? actor.actorName,
      locationCode: details.locationCode ?? null,
      verificationChannel: details.verificationChannel ?? null,
      verificationResult: details.verificationResult ?? null,
      payload: details.payload ?? {},
      occurredAt: details.occurredAt ?? new Date(),
    });
    return event;
  }

  async logVerificationAttempt(req, details = {}) {
    const actor = extractActor(req);
    return models.StampLabelVerificationAttempt.create({
      id: randomUUID(),
      organizationId: details.organizationId || req?.organizationId || null,
      stampLabelId: details.stampLabelId || null,
      stampUid: details.stampUid,
      channel: details.channel || null,
      result: details.result,
      stampStatus: details.stampStatus || null,
      locationCode: details.locationCode || null,
      inspectorBadge: details.inspectorBadge || null,
      remarks: details.remarks || null,
      actorId: details.actorId || actor.actorId,
      actorName: details.actorName || actor.actorName,
      metadata: details.metadata || {},
      verifiedAt: details.verifiedAt || new Date(),
    });
  }

  async getStampOrFail(req, id) {
    const stamp = await this.stampLabelRepository.findByIdDetailed(req, id);
    if (!stamp) {
      throw new HttpError(404, 'NOT_FOUND', 'Stamp label not found');
    }
    return stamp;
  }

  async getBatchStampsOrFail(req, batchNumber) {
    const normalizedBatchNumber = normalizeBatchNumber(batchNumber);
    if (!normalizedBatchNumber) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'batchNumber is required');
    }

    const stamps = await this.stampLabelRepository.findManyByBatchNumber(
      req,
      normalizedBatchNumber,
    );
    if (!Array.isArray(stamps) || stamps.length === 0) {
      throw new HttpError(404, 'NOT_FOUND', 'No stamp labels found for batchNumber');
    }

    return {
      batchNumber: normalizedBatchNumber,
      stamps,
    };
  }

  async applyStatusUpdate(req, stamp, nextStatus, patch = {}) {
    const currentRank = statusRank(stamp.status);
    const nextRank = statusRank(nextStatus);
    const status = nextRank >= currentRank ? nextStatus : stamp.status;
    return this.stampLabelRepository.update(req, stamp.id, {
      ...patch,
      status,
    });
  }

  async getEligibleStampRequestOrFail(req, stampRequestId) {
    if (!stampRequestId) {
      throw new HttpError(
        400,
        'VALIDATION_ERROR',
        'stampRequestId is required for stamp generation',
      );
    }

    const stampRequest = await models.ExciseStampRequest.findByPk(stampRequestId, {
      attributes: [
        'id',
        'organizationId',
        'requestNumber',
        'status',
        'quantity',
        'generatedQuantity',
        'productId',
        'variantId',
        'goodsCategory',
        'goodsDescription',
      ],
    });

    if (!stampRequest) {
      throw new HttpError(404, 'NOT_FOUND', 'Referenced stamp request not found');
    }

    const isSystem = req?.isSystem === true;
    if (!isSystem && req?.organizationId && stampRequest.organizationId !== req.organizationId) {
      throw new HttpError(404, 'NOT_FOUND', 'Referenced stamp request not found');
    }

    if (
      ![
        STAMP_REQUEST_STATUS.APPROVED,
        STAMP_REQUEST_STATUS.FULFILLED,
      ].includes(stampRequest.status)
    ) {
      throw new HttpError(
        409,
        'STAMP_REQUEST_NOT_ELIGIBLE',
        'Stamp request must be APPROVED or FULFILLED before generation',
      );
    }

    return stampRequest;
  }

  generate = async (req, body = {}) => {
    await ensureStampLabelSchema();
    await ensureStampRequestSchema();
    await ensureExciseConfigSchema();
    const count = Number(body.count || 1);
    if (!Number.isFinite(count) || count < 1 || count > 5000) {
      throw new HttpError(
        400,
        'VALIDATION_ERROR',
        'count must be between 1 and 5000',
      );
    }

    const stampRequest = await this.getEligibleStampRequestOrFail(
      req,
      body.stampRequestId,
    );

    const fromLabels = await this.stampLabelRepository.getModel().count({
      where: { stampRequestId: stampRequest.id },
    });
    const fromField = Number(stampRequest.generatedQuantity) || 0;
    const alreadyGenerated = Math.max(fromField, fromLabels);
    const remaining = stampRequest.quantity - alreadyGenerated;
    if (remaining < 0) {
      await stampRequest.update({ generatedQuantity: fromLabels });
      throw new HttpError(
        409,
        'STAMP_REQUEST_QUANTITY_EXCEEDED',
        `Stamp request has ${fromLabels} label(s) but approved quantity is ${stampRequest.quantity}; counter was corrected.`,
      );
    }
    if (count > remaining) {
      throw new HttpError(
        409,
        'STAMP_REQUEST_QUANTITY_EXCEEDED',
        `Requested ${count} stamp(s) but only ${remaining} remaining of ${stampRequest.quantity} approved (${alreadyGenerated} already generated).`,
      );
    }

    const now = new Date();
    const digitalLinkBase = await this.getDigitalLinkBaseUrl(req);
    const generatedBatchNumber = await this.nextBatchNumber();
    const batch = await this.stampLabelBatchRepository.create(req, {
      id: randomUUID(),
      organizationId: stampRequest.organizationId || req?.organizationId || null,
      batchNumber: generatedBatchNumber,
      status: STAMP_LABEL_BATCH_STATUS.GENERATED,
      totalCount: count,
      generatedCount: count,
      issuedCount: 0,
      printedCount: 0,
      notes: body.notes || null,
      metadata: body.batchMetadata || {},
    });
    const resolvedTemplate = await this.resolveTemplate(req, stampRequest, body);
    const templateSecurityFeatures = normalizeTemplateFeatureCodes(
      (resolvedTemplate?.securityFeatures || []).map((x) => x.featureCode),
    );
    const effectiveUidPrefix = body.uidPrefix || resolvedTemplate?.uidPrefix || 'ET-EXS';
    const effectiveCodeFormat =
      body.codeFormat ||
      resolvedTemplate?.codeFormat ||
      STAMP_LABEL_CODE_FORMAT.QR;
    const effectivePackageLevel =
      body.packageLevel ||
      resolvedTemplate?.packageLevel ||
      STAMP_LABEL_PACKAGE_LEVEL.UNIT;
    const operatorContext = await this.resolveOrganizationOperatorContext(
      req,
      stampRequest,
      body,
    );
    if (!operatorContext.operatorType || !operatorContext.operatorName || !operatorContext.operatorTin) {
      throw new HttpError(
        400,
        'VALIDATION_ERROR',
        'Operator type, name, and TIN must be configured on organization detail or provided',
      );
    }
    const created = [];
    for (let i = 0; i < count; i += 1) {
      const stampUid = buildStampUid(effectiveUidPrefix);
      const stamp = await this.stampLabelRepository.create(req, {
        id: randomUUID(),
        organizationId: operatorContext.organizationId,
        stampRequestId: stampRequest.id,
        stampRequestNumber: stampRequest.requestNumber,
        templateId: resolvedTemplate?.id || null,
        templateCode: body.templateCode || resolvedTemplate?.code || null,
        templateVersion: body.templateVersion || resolvedTemplate?.version || null,
        templateLifecycleStatus:
          resolvedTemplate?.lifecycleStatus ||
          STAMP_LABEL_TEMPLATE_LIFECYCLE_STATUS.ACTIVE,
        templateResolvedBy:
          resolvedTemplate?.resolvedBy ||
          STAMP_LABEL_TEMPLATE_RESOLVED_BY.PRODUCT,
        templateQrEnabled:
          resolvedTemplate?.qrEnabled !== undefined ? Boolean(resolvedTemplate.qrEnabled) : true,
        templateSerialPattern: resolvedTemplate?.serialPattern || null,
        templateSecurityFeatures:
          templateSecurityFeatures.length > 0
            ? templateSecurityFeatures
            : [
                STAMP_LABEL_SECURITY_FEATURE.UNIQUE_IDENTIFIER,
                STAMP_LABEL_SECURITY_FEATURE.ANTI_DUPLICATION_GUARD,
              ],
        templateLabelStructure: resolvedTemplate?.labelStructure || null,
        stampUid,
        digitalLink: `${digitalLinkBase}/${stampUid}`,
        codeFormat: effectiveCodeFormat,
        status: STAMP_LABEL_LIFECYCLE_STATUS.GENERATED,
        operatorType: operatorContext.operatorType,
        operatorName: operatorContext.operatorName,
        operatorTin: operatorContext.operatorTin,
        operatorLicenseNumber: operatorContext.operatorLicenseNumber,
        merchantId: operatorContext.merchantId,
        merchantName: operatorContext.merchantName,
        ethiopiaRevenueOffice: body.ethiopiaRevenueOffice || null,
        productId: body.productId || null,
        productName:
          body.productName ||
          stampRequest.goodsDescription ||
          stampRequest.goodsCategory ||
          null,
        packageLevel: effectivePackageLevel,
        batchId: batch.id,
        batchNumber: generatedBatchNumber,
        productionDate: body.productionDate || null,
        forecastReference: body.forecastReference || null,
        forecastSubmittedAt: body.forecastSubmittedAt || null,
        requiresSixtyDayForecast: body.requiresSixtyDayForecast ?? true,
        isImported: body.isImported ?? false,
        customsDeclarationNumber: body.customsDeclarationNumber || null,
        generatedAt: now,
        metadata: body.metadata || {},
      });

      created.push(stamp);

      await this.logEvent(req, stamp, STAMP_LABEL_EVENT_TYPE.GENERATED, {
        fromStatus: null,
        toStatus: STAMP_LABEL_LIFECYCLE_STATUS.GENERATED,
        payload: {
          generationBatchSize: count,
          stampRequest: {
            id: stampRequest.id,
            requestNumber: stampRequest.requestNumber,
            status: stampRequest.status,
            quantity: stampRequest.quantity,
            generatedQuantity: alreadyGenerated + created.length,
          },
          ethiopianContext: {
            requiresSixtyDayForecast: stamp.requiresSixtyDayForecast,
            ethiopiaRevenueOffice: stamp.ethiopiaRevenueOffice,
            batchNumber: stamp.batchNumber,
            merchantId: stamp.merchantId,
            merchantName: stamp.merchantName,
          },
          template: {
            id: stamp.templateId,
            code: stamp.templateCode,
            version: stamp.templateVersion,
            lifecycleStatus: stamp.templateLifecycleStatus,
            resolvedBy: stamp.templateResolvedBy,
            qrEnabled: stamp.templateQrEnabled,
            serialPattern: stamp.templateSerialPattern,
            securityFeatures: stamp.templateSecurityFeatures,
            labelStructure: stamp.templateLabelStructure,
          },
        },
        occurredAt: now,
      });
    }

    const newGeneratedTotal = alreadyGenerated + created.length;
    await stampRequest.update({ generatedQuantity: newGeneratedTotal });

    return {
      batch,
      generatedCount: created.length,
      generatedQuantity: newGeneratedTotal,
      remainingQuantity: stampRequest.quantity - newGeneratedTotal,
      batchNumber: generatedBatchNumber,
      stamps: created,
    };
  };

  issue = async (req, id, body = {}) => {
    await ensureStampLabelSchema();
    const stamp = await this.getStampOrFail(req, id);
    ensureLifecycle(stamp.status, [STAMP_LABEL_LIFECYCLE_STATUS.GENERATED], 'issue');

    const issueTime = body.issuedAt ? new Date(body.issuedAt) : new Date();
    if (Number.isNaN(issueTime.getTime())) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'issuedAt is invalid');
    }

    if (stamp.requiresSixtyDayForecast && stamp.forecastSubmittedAt) {
      const forecastDate = new Date(stamp.forecastSubmittedAt);
      const leadMs = issueTime.getTime() - forecastDate.getTime();
      const minimumLeadMs = 60 * 24 * 60 * 60 * 1000;
      if (leadMs < minimumLeadMs) {
        throw new HttpError(
          409,
          'FORECAST_LEAD_TIME_NOT_MET',
          'Forecast reference must be submitted at least 60 days before issuance',
        );
      }
    }

    const updated = await this.applyStatusUpdate(
      req,
      stamp,
      STAMP_LABEL_LIFECYCLE_STATUS.ISSUED,
      {
        issuedAt: issueTime,
        notes: body.notes ?? stamp.notes,
      },
    );

    await this.logEvent(req, updated, STAMP_LABEL_EVENT_TYPE.ISSUED, {
      fromStatus: stamp.status,
      toStatus: updated.status,
      payload: {
        forecastReference: updated.forecastReference,
        notes: body.notes || null,
      },
      occurredAt: issueTime,
    });

    await this.refreshBatchFromStamps(req, updated.batchId);

    return updated;
  };

  issueByBatch = async (req, batchNumber, body = {}) => {
    await ensureStampLabelSchema();
    const { batchNumber: resolvedBatchNumber, stamps } = await this.getBatchStampsOrFail(
      req,
      batchNumber,
    );
    const issueTime = body.issuedAt ? new Date(body.issuedAt) : new Date();
    if (Number.isNaN(issueTime.getTime())) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'issuedAt is invalid');
    }

    for (const stamp of stamps) {
      ensureLifecycle(stamp.status, [STAMP_LABEL_LIFECYCLE_STATUS.GENERATED], 'issue');
      if (stamp.requiresSixtyDayForecast && stamp.forecastSubmittedAt) {
        const forecastDate = new Date(stamp.forecastSubmittedAt);
        const leadMs = issueTime.getTime() - forecastDate.getTime();
        const minimumLeadMs = 60 * 24 * 60 * 60 * 1000;
        if (leadMs < minimumLeadMs) {
          throw new HttpError(
            409,
            'FORECAST_LEAD_TIME_NOT_MET',
            `Forecast reference must be submitted at least 60 days before issuance (batch ${resolvedBatchNumber})`,
          );
        }
      }
    }

    const updatedStamps = [];
    for (const stamp of stamps) {
      const updated = await this.applyStatusUpdate(
        req,
        stamp,
        STAMP_LABEL_LIFECYCLE_STATUS.ISSUED,
        {
          issuedAt: issueTime,
          notes: body.notes ?? stamp.notes,
        },
      );
      await this.logEvent(req, updated, STAMP_LABEL_EVENT_TYPE.ISSUED, {
        fromStatus: stamp.status,
        toStatus: updated.status,
        payload: {
          batchNumber: resolvedBatchNumber,
          forecastReference: updated.forecastReference,
          notes: body.notes || null,
        },
        occurredAt: issueTime,
      });
      updatedStamps.push(updated);
    }

    const refreshedBatch = await this.refreshBatchFromStamps(req, updatedStamps[0]?.batchId);

    return {
      batchNumber: resolvedBatchNumber,
      processedCount: updatedStamps.length,
      status: refreshedBatch?.status || STAMP_LABEL_BATCH_STATUS.ISSUED,
      stamps: updatedStamps,
    };
  };

  printByBatch = async (req, batchNumber, body = {}) => {
    await ensureStampLabelSchema();
    const batch = await this.getBatchOrFail(req, batchNumber);
    const refreshed = await this.refreshBatchFromStamps(req, batch.id);
    const issuedCount = Number(refreshed?.issuedCount || 0);
    const totalCount = Number(refreshed?.totalCount || 0);
    if (issuedCount <= 0) {
      throw new HttpError(
        409,
        'BATCH_NOT_READY_FOR_PRINT',
        'No issued stamps available to print in this batch',
      );
    }

    const requestedPrinted = Number(body.printedCount || issuedCount);
    const printedCount = Math.max(0, Math.min(requestedPrinted, issuedCount));
    const status = this.deriveBatchStatus(totalCount, issuedCount, printedCount);
    const printedAt = body.printedAt ? new Date(body.printedAt) : new Date();
    if (Number.isNaN(printedAt.getTime())) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'printedAt is invalid');
    }

    const updated = await this.stampLabelBatchRepository.update(req, batch.id, {
      printedCount,
      printedAt,
      status,
      notes: body.notes ?? batch.notes,
    });

    return updated;
  };

  createBatch = async (req, body = {}) => {
    await ensureStampLabelSchema();
    const rawBatchNumber = normalizeBatchNumber(body.batchNumber);
    const batchNumberValue = rawBatchNumber || (await this.nextBatchNumber());
    const exists = await this.stampLabelBatchRepository.findByBatchNumber(req, batchNumberValue);
    if (exists) {
      throw new HttpError(409, 'BATCH_NUMBER_ALREADY_EXISTS', 'Batch number already exists');
    }
    return this.stampLabelBatchRepository.create(req, {
      id: randomUUID(),
      organizationId: body.organizationId || req?.organizationId || null,
      batchNumber: batchNumberValue,
      status: body.status || STAMP_LABEL_BATCH_STATUS.GENERATED,
      totalCount: Number(body.totalCount || 0),
      generatedCount: Number(body.generatedCount || 0),
      issuedCount: Number(body.issuedCount || 0),
      printedCount: Number(body.printedCount || 0),
      printedAt: body.printedAt || null,
      notes: body.notes || null,
      metadata: body.metadata || {},
    });
  };

  updateBatch = async (req, id, body = {}) => {
    await ensureStampLabelSchema();
    const current = await this.stampLabelBatchRepository.findById(req, id);
    if (!current) {
      throw new HttpError(404, 'NOT_FOUND', 'Batch not found');
    }
    const patch = {};
    if (body.status !== undefined) patch.status = body.status;
    if (body.notes !== undefined) patch.notes = body.notes || null;
    if (body.metadata !== undefined) patch.metadata = body.metadata || {};
    if (body.printedAt !== undefined) patch.printedAt = body.printedAt || null;
    if (body.printedCount !== undefined) patch.printedCount = Number(body.printedCount || 0);

    const updated = await this.stampLabelBatchRepository.update(req, id, patch);
    await this.refreshBatchFromStamps(req, id);
    return this.stampLabelBatchRepository.findById(req, updated.id);
  };

  deleteBatch = async (req, id) => {
    await ensureStampLabelSchema();
    const current = await this.stampLabelBatchRepository.findById(req, id);
    if (!current) {
      throw new HttpError(404, 'NOT_FOUND', 'Batch not found');
    }
    const linkedStamps = await this.stampLabelRepository.findMany(req, { batchId: id });
    if (linkedStamps.length > 0) {
      throw new HttpError(
        409,
        'BATCH_HAS_STAMPS',
        'Cannot delete batch while stamp labels are linked to it',
      );
    }
    await this.stampLabelBatchRepository.delete(req, id);
    return { message: 'Batch deleted successfully' };
  };

  assign = async (req, id, body = {}) => {
    await ensureStampLabelSchema();
    const stamp = await this.getStampOrFail(req, id);
    ensureLifecycle(stamp.status, [STAMP_LABEL_LIFECYCLE_STATUS.ISSUED], 'assign');

    const assignedAt = body.assignedAt ? new Date(body.assignedAt) : new Date();
    const updated = await this.applyStatusUpdate(
      req,
      stamp,
      STAMP_LABEL_LIFECYCLE_STATUS.ASSIGNED,
      {
        assignedAt,
        assignedToOperatorId: body.assignedToOperatorId || null,
      },
    );

    await this.logEvent(req, updated, STAMP_LABEL_EVENT_TYPE.ASSIGNED, {
      fromStatus: stamp.status,
      toStatus: updated.status,
      payload: {
        assignedToOperatorId: updated.assignedToOperatorId,
      },
      occurredAt: assignedAt,
    });

    return updated;
  };

  apply = async (req, id, body = {}) => {
    await ensureStampLabelSchema();
    const stamp = await this.getStampOrFail(req, id);
    ensureLifecycle(stamp.status, [STAMP_LABEL_LIFECYCLE_STATUS.ASSIGNED], 'apply');

    const appliedAt = body.appliedAt ? new Date(body.appliedAt) : new Date();
    const updated = await this.applyStatusUpdate(
      req,
      stamp,
      STAMP_LABEL_LIFECYCLE_STATUS.APPLIED,
      {
        appliedAt,
        applicationLineCode: body.applicationLineCode || null,
      },
    );

    await this.logEvent(req, updated, STAMP_LABEL_EVENT_TYPE.APPLIED, {
      fromStatus: stamp.status,
      toStatus: updated.status,
      locationCode: body.locationCode || null,
      payload: {
        applicationLineCode: updated.applicationLineCode,
      },
      occurredAt: appliedAt,
    });

    return updated;
  };

  activate = async (req, id, body = {}) => {
    await ensureStampLabelSchema();
    const stamp = await this.getStampOrFail(req, id);
    ensureLifecycle(stamp.status, [STAMP_LABEL_LIFECYCLE_STATUS.APPLIED], 'activate');

    const activatedAt = body.activatedAt ? new Date(body.activatedAt) : new Date();
    const updated = await this.applyStatusUpdate(
      req,
      stamp,
      STAMP_LABEL_LIFECYCLE_STATUS.ACTIVATED,
      {
        activatedAt,
        activationLocationCode: body.activationLocationCode || null,
        lastKnownLocationCode:
          body.activationLocationCode || stamp.lastKnownLocationCode || null,
      },
    );

    await this.logEvent(req, updated, STAMP_LABEL_EVENT_TYPE.ACTIVATED, {
      fromStatus: stamp.status,
      toStatus: updated.status,
      locationCode: updated.activationLocationCode,
      occurredAt: activatedAt,
    });

    return updated;
  };

  track = async (req, id, body = {}) => {
    await ensureStampLabelSchema();
    const stamp = await this.getStampOrFail(req, id);
    ensureLifecycle(
      stamp.status,
      [
        STAMP_LABEL_LIFECYCLE_STATUS.ACTIVATED,
        STAMP_LABEL_LIFECYCLE_STATUS.TRACKED,
        STAMP_LABEL_LIFECYCLE_STATUS.VERIFIED,
        STAMP_LABEL_LIFECYCLE_STATUS.AUDITED,
      ],
      'track',
    );

    const trackedAt = body.trackedAt ? new Date(body.trackedAt) : new Date();
    const updated = await this.applyStatusUpdate(
      req,
      stamp,
      STAMP_LABEL_LIFECYCLE_STATUS.TRACKED,
      {
        trackedAt,
        lastKnownLocationCode: body.locationCode || stamp.lastKnownLocationCode || null,
      },
    );

    await this.logEvent(req, updated, STAMP_LABEL_EVENT_TYPE.TRACKED, {
      fromStatus: stamp.status,
      toStatus: updated.status,
      locationCode: body.locationCode || null,
      payload: {
        checkpoint: body.checkpoint || null,
        scanDeviceId: body.scanDeviceId || null,
      },
      occurredAt: trackedAt,
    });

    return updated;
  };

  verify = async (req, id, body = {}) => {
    await ensureStampLabelSchema();
    const stamp = await this.getStampOrFail(req, id);
    ensureLifecycle(
      stamp.status,
      [
        STAMP_LABEL_LIFECYCLE_STATUS.ACTIVATED,
        STAMP_LABEL_LIFECYCLE_STATUS.TRACKED,
        STAMP_LABEL_LIFECYCLE_STATUS.VERIFIED,
        STAMP_LABEL_LIFECYCLE_STATUS.AUDITED,
        STAMP_LABEL_LIFECYCLE_STATUS.REVOKED,
      ],
      'verify',
    );

    const verifiedAt = body.verifiedAt ? new Date(body.verifiedAt) : new Date();
    const requestedResult = body.result || null;
    if (requestedResult === STAMP_LABEL_VERIFICATION_RESULT.NOT_FOUND) {
      throw new HttpError(
        400,
        'VALIDATION_ERROR',
        'result NOT_FOUND is resolved automatically by backend',
      );
    }
    if (
      requestedResult === STAMP_LABEL_VERIFICATION_RESULT.CANCELLED_UI &&
      stamp.status !== STAMP_LABEL_LIFECYCLE_STATUS.REVOKED
    ) {
      throw new HttpError(
        400,
        'VALIDATION_ERROR',
        'result CANCELLED_UI is only allowed for revoked stamps',
      );
    }
    const verificationResult =
      stamp.status === STAMP_LABEL_LIFECYCLE_STATUS.REVOKED
        ? STAMP_LABEL_VERIFICATION_RESULT.CANCELLED_UI
        : requestedResult || STAMP_LABEL_VERIFICATION_RESULT.AUTHENTIC;

    const nextStatus =
      stamp.status === STAMP_LABEL_LIFECYCLE_STATUS.REVOKED
        ? STAMP_LABEL_LIFECYCLE_STATUS.REVOKED
        : STAMP_LABEL_LIFECYCLE_STATUS.VERIFIED;

    const updated = await this.applyStatusUpdate(req, stamp, nextStatus, {
      verifiedAt,
      lastVerificationResult: verificationResult,
      lastKnownLocationCode: body.locationCode || stamp.lastKnownLocationCode || null,
    });

    await this.logEvent(req, updated, STAMP_LABEL_EVENT_TYPE.VERIFIED, {
      fromStatus: stamp.status,
      toStatus: updated.status,
      locationCode: body.locationCode || null,
      verificationChannel: body.channel || null,
      verificationResult,
      payload: {
        inspectorBadge: body.inspectorBadge || null,
        remarks: body.remarks || null,
      },
      occurredAt: verifiedAt,
    });

    await this.logVerificationAttempt(req, {
      organizationId: updated.organizationId,
      stampLabelId: updated.id,
      stampUid: updated.stampUid,
      channel: body.channel || null,
      result: verificationResult,
      stampStatus: updated.status,
      locationCode: body.locationCode || null,
      inspectorBadge: body.inspectorBadge || null,
      remarks: body.remarks || null,
      metadata: {
        route: 'verify',
      },
      verifiedAt,
    });

    return updated;
  };

  verifyByUid = async (req, body = {}) => {
    await ensureStampLabelSchema();
    const stampUid = String(body.stampUid || '').trim();
    const verifiedAt = body.verifiedAt ? new Date(body.verifiedAt) : new Date();
    const stamp = await this.stampLabelRepository.findByUid(req, stampUid);
    if (!stamp) {
      await this.logVerificationAttempt(req, {
        stampUid,
        channel: body.channel || null,
        result: STAMP_LABEL_VERIFICATION_RESULT.NOT_FOUND,
        stampStatus: null,
        locationCode: body.locationCode || null,
        inspectorBadge: body.inspectorBadge || null,
        remarks: body.remarks || null,
        metadata: {
          route: 'public-verify',
          notFound: true,
        },
        verifiedAt,
      });
      return {
        status: STAMP_LABEL_VERIFICATION_RESULT.NOT_FOUND,
        stampUid,
        verification: {
          channel: body.channel || null,
          locationCode: body.locationCode || null,
          remarks: body.remarks || null,
          inspectorBadge: body.inspectorBadge || null,
          verifiedAt,
        },
      };
    }
    const verified = await this.verify(req, stamp.id, {
      ...body,
      verifiedAt,
    });
    return {
      status: verified.lastVerificationResult,
      stamp: verified,
    };
  };

  audit = async (req, id, body = {}) => {
    await ensureStampLabelSchema();
    const stamp = await this.getStampOrFail(req, id);
    if (stamp.status === STAMP_LABEL_LIFECYCLE_STATUS.GENERATED) {
      throw new HttpError(
        409,
        'STAMP_LIFECYCLE_CONFLICT',
        'Generated stamps must be issued before audit',
      );
    }

    const auditedAt = body.auditedAt ? new Date(body.auditedAt) : new Date();
    const nextStatus =
      stamp.status === STAMP_LABEL_LIFECYCLE_STATUS.REVOKED
        ? STAMP_LABEL_LIFECYCLE_STATUS.REVOKED
        : STAMP_LABEL_LIFECYCLE_STATUS.AUDITED;

    const updated = await this.applyStatusUpdate(req, stamp, nextStatus, {
      auditedAt,
      notes: body.notes ?? stamp.notes,
    });

    await this.logEvent(req, updated, STAMP_LABEL_EVENT_TYPE.AUDITED, {
      fromStatus: stamp.status,
      toStatus: updated.status,
      payload: {
        inspectionReference: body.inspectionReference || null,
        findings: body.findings || null,
      },
      occurredAt: auditedAt,
    });

    return updated;
  };

  auditByBatch = async (req, batchNumber, body = {}) => {
    await ensureStampLabelSchema();
    const { batchNumber: resolvedBatchNumber, stamps } = await this.getBatchStampsOrFail(
      req,
      batchNumber,
    );
    for (const stamp of stamps) {
      if (stamp.status === STAMP_LABEL_LIFECYCLE_STATUS.GENERATED) {
        throw new HttpError(
          409,
          'STAMP_LIFECYCLE_CONFLICT',
          `Generated stamps must be issued before audit (batch ${resolvedBatchNumber})`,
        );
      }
    }

    const auditedAt = body.auditedAt ? new Date(body.auditedAt) : new Date();
    if (Number.isNaN(auditedAt.getTime())) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'auditedAt is invalid');
    }

    const updatedStamps = [];
    for (const stamp of stamps) {
      const nextStatus =
        stamp.status === STAMP_LABEL_LIFECYCLE_STATUS.REVOKED
          ? STAMP_LABEL_LIFECYCLE_STATUS.REVOKED
          : STAMP_LABEL_LIFECYCLE_STATUS.AUDITED;

      const updated = await this.applyStatusUpdate(req, stamp, nextStatus, {
        auditedAt,
        notes: body.notes ?? stamp.notes,
      });
      await this.logEvent(req, updated, STAMP_LABEL_EVENT_TYPE.AUDITED, {
        fromStatus: stamp.status,
        toStatus: updated.status,
        payload: {
          batchNumber: resolvedBatchNumber,
          inspectionReference: body.inspectionReference || null,
          findings: body.findings || null,
        },
        occurredAt: auditedAt,
      });
      updatedStamps.push(updated);
    }

    return {
      batchNumber: resolvedBatchNumber,
      processedCount: updatedStamps.length,
      status: STAMP_LABEL_LIFECYCLE_STATUS.AUDITED,
      stamps: updatedStamps,
    };
  };

  enforce = async (req, id, body = {}) => {
    await ensureStampLabelSchema();
    const stamp = await this.getStampOrFail(req, id);
    const action = body.action;
    if (!Object.values(STAMP_LABEL_ENFORCEMENT_ACTION).includes(action)) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'Invalid enforcement action');
    }

    const enforcementAt = body.enforcedAt ? new Date(body.enforcedAt) : new Date();
    const isRevoke = action === STAMP_LABEL_ENFORCEMENT_ACTION.REVOKE;
    const updated = await this.stampLabelRepository.update(req, stamp.id, {
      enforcementState: action,
      revokedAt: isRevoke ? enforcementAt : stamp.revokedAt,
      status: isRevoke ? STAMP_LABEL_LIFECYCLE_STATUS.REVOKED : stamp.status,
      notes: body.notes ?? stamp.notes,
    });

    await this.logEvent(req, updated, STAMP_LABEL_EVENT_TYPE.ENFORCEMENT, {
      fromStatus: stamp.status,
      toStatus: updated.status,
      payload: {
        action,
        caseNumber: body.caseNumber || null,
        notes: body.notes || null,
      },
      occurredAt: enforcementAt,
    });

    await this.refreshBatchFromStamps(req, updated.batchId);

    return updated;
  };

  enforceByBatch = async (req, batchNumber, body = {}) => {
    await ensureStampLabelSchema();
    const { batchNumber: resolvedBatchNumber, stamps } = await this.getBatchStampsOrFail(
      req,
      batchNumber,
    );

    const action = body.action;
    if (!Object.values(STAMP_LABEL_ENFORCEMENT_ACTION).includes(action)) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'Invalid enforcement action');
    }

    const enforcementAt = body.enforcedAt ? new Date(body.enforcedAt) : new Date();
    if (Number.isNaN(enforcementAt.getTime())) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'enforcedAt is invalid');
    }

    const isRevoke = action === STAMP_LABEL_ENFORCEMENT_ACTION.REVOKE;
    const updatedStamps = [];
    for (const stamp of stamps) {
      const updated = await this.stampLabelRepository.update(req, stamp.id, {
        enforcementState: action,
        revokedAt: isRevoke ? enforcementAt : stamp.revokedAt,
        status: isRevoke ? STAMP_LABEL_LIFECYCLE_STATUS.REVOKED : stamp.status,
        notes: body.notes ?? stamp.notes,
      });

      await this.logEvent(req, updated, STAMP_LABEL_EVENT_TYPE.ENFORCEMENT, {
        fromStatus: stamp.status,
        toStatus: updated.status,
        payload: {
          action,
          batchNumber: resolvedBatchNumber,
          caseNumber: body.caseNumber || null,
          notes: body.notes || null,
        },
        occurredAt: enforcementAt,
      });
      updatedStamps.push(updated);
    }

    const refreshedBatch = await this.refreshBatchFromStamps(req, updatedStamps[0]?.batchId);
    return {
      batchNumber: resolvedBatchNumber,
      action,
      processedCount: updatedStamps.length,
      status: refreshedBatch?.status || null,
      stamps: updatedStamps,
    };
  };

  createTemplate = async (req, body = {}) => {
    await ensureStampLabelSchema();
    const productId = body.productId || null;
    const variantId = body.variantId || null;
    const categoryId = body.categoryId || null;

    if (variantId && !productId) {
      throw new HttpError(
        400,
        'VALIDATION_ERROR',
        'productId is required when variantId is provided',
      );
    }
    if (productId && variantId) {
      const variant = await models.ProductVariant.findByPk(variantId);
      if (!variant || variant.productId !== productId) {
        throw new HttpError(
          400,
          'VALIDATION_ERROR',
          'variantId must belong to productId',
        );
      }
    }

    const resolvedBy = String(
      body.resolvedBy || STAMP_LABEL_TEMPLATE_RESOLVED_BY.PRODUCT,
    )
      .trim()
      .toUpperCase();
    this.validateTemplateTargetByResolvedBy(resolvedBy, {
      productId,
      variantId,
      categoryId,
    });

    const created = await this.stampLabelTemplateRepository.create(req, {
      code: String(body.code || '').trim(),
      version: String(body.version || 'v1').trim(),
      lifecycleStatus: String(body.lifecycleStatus || 'ACTIVE').trim().toUpperCase(),
      resolvedBy,
      productId,
      variantId,
      categoryId,
      codeFormat: String(body.codeFormat || 'QR').trim().toUpperCase(),
      uidPrefix: body.uidPrefix ? String(body.uidPrefix).trim() : null,
      packageLevel: String(body.packageLevel || 'UNIT').trim().toUpperCase(),
      qrEnabled: body.qrEnabled !== undefined ? Boolean(body.qrEnabled) : true,
      serialPattern: body.serialPattern ? String(body.serialPattern).trim() : null,
      colorCode: body.colorCode ? String(body.colorCode).trim() : null,
      labelStructure: body.labelStructure ? String(body.labelStructure) : null,
    });

    const features = Array.isArray(body.securityFeatures) ? body.securityFeatures : [];
    for (const feature of features) {
      const featureCode = String(feature || '').trim().toUpperCase();
      if (!featureCode) continue;
      await models.StampLabelTemplateSecurityFeature.findOrCreate({
        where: { templateId: created.id, featureCode },
        defaults: { templateId: created.id, featureCode },
      });
    }

    return this.stampLabelTemplateRepository.findByIdDetailed(req, created.id);
  };

  updateTemplate = async (req, id, body = {}) => {
    await ensureStampLabelSchema();
    const current = await this.stampLabelTemplateRepository.findByIdDetailed(req, id);
    if (!current) {
      throw new HttpError(404, 'NOT_FOUND', 'Stamp template not found');
    }

    const patch = {};
    const productId = body.productId !== undefined ? body.productId || null : current.productId;
    const variantId = body.variantId !== undefined ? body.variantId || null : current.variantId;

    if (variantId && !productId) {
      throw new HttpError(
        400,
        'VALIDATION_ERROR',
        'productId is required when variantId is provided',
      );
    }
    if (productId && variantId) {
      const variant = await models.ProductVariant.findByPk(variantId);
      if (!variant || variant.productId !== productId) {
        throw new HttpError(
          400,
          'VALIDATION_ERROR',
          'variantId must belong to productId',
        );
      }
    }

    const nextResolvedBy =
      body.resolvedBy !== undefined
        ? String(body.resolvedBy || '').trim().toUpperCase()
        : current.resolvedBy;
    this.validateTemplateTargetByResolvedBy(nextResolvedBy, {
      productId,
      variantId,
      categoryId: body.categoryId !== undefined ? body.categoryId || null : current.categoryId,
    });

    if (body.code !== undefined) patch.code = String(body.code || '').trim();
    if (body.version !== undefined) patch.version = String(body.version || '').trim();
    if (body.lifecycleStatus !== undefined) {
      patch.lifecycleStatus = String(body.lifecycleStatus || '').trim().toUpperCase();
    }
    if (body.resolvedBy !== undefined) {
      patch.resolvedBy = String(body.resolvedBy || '').trim().toUpperCase();
    }
    if (body.productId !== undefined) patch.productId = body.productId || null;
    if (body.variantId !== undefined) patch.variantId = body.variantId || null;
    if (body.categoryId !== undefined) patch.categoryId = body.categoryId || null;
    if (body.codeFormat !== undefined) {
      patch.codeFormat = String(body.codeFormat || '').trim().toUpperCase();
    }
    if (body.uidPrefix !== undefined) patch.uidPrefix = body.uidPrefix ? String(body.uidPrefix).trim() : null;
    if (body.packageLevel !== undefined) {
      patch.packageLevel = String(body.packageLevel || '').trim().toUpperCase();
    }
    if (body.qrEnabled !== undefined) patch.qrEnabled = Boolean(body.qrEnabled);
    if (body.serialPattern !== undefined) {
      patch.serialPattern = body.serialPattern ? String(body.serialPattern).trim() : null;
    }
    if (body.colorCode !== undefined) {
      patch.colorCode = body.colorCode ? String(body.colorCode).trim() : null;
    }
    if (body.labelStructure !== undefined) {
      patch.labelStructure = body.labelStructure ? String(body.labelStructure) : null;
    }

    await this.stampLabelTemplateRepository.update(req, id, patch);

    if (body.securityFeatures !== undefined) {
      await models.StampLabelTemplateSecurityFeature.destroy({ where: { templateId: id } });
      const features = Array.isArray(body.securityFeatures) ? body.securityFeatures : [];
      for (const feature of features) {
        const featureCode = String(feature || '').trim().toUpperCase();
        if (!featureCode) continue;
        await models.StampLabelTemplateSecurityFeature.create({ templateId: id, featureCode });
      }
    }

    return this.stampLabelTemplateRepository.findByIdDetailed(req, id);
  };

  deleteTemplate = async (req, id) => {
    await ensureStampLabelSchema();
    const current = await this.stampLabelTemplateRepository.findByIdDetailed(req, id);
    if (!current) {
      throw new HttpError(404, 'NOT_FOUND', 'Stamp template not found');
    }
    await models.StampLabelTemplateSecurityFeature.destroy({ where: { templateId: id } });
    await this.stampLabelTemplateRepository.delete(req, id);
    return { message: 'Stamp template deleted successfully' };
  };
}
