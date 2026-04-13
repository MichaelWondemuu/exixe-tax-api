import { models } from '../../../shared/db/data-source.js';
import { BaseRepository } from '../../../shared/repository/base.repository.js';
import { Op } from 'sequelize';

const STAMP_LABEL_ATTRIBUTES = [
  'id',
  'organizationId',
  'stampRequestId',
  'stampRequestNumber',
  'templateId',
  'templateCode',
  'templateVersion',
  'templateLifecycleStatus',
  'templateResolvedBy',
  'templateQrEnabled',
  'templateSerialPattern',
  'templateSecurityFeatures',
  'templateLabelStructure',
  'stampUid',
  'digitalLink',
  'codeFormat',
  'status',
  'operatorType',
  'operatorName',
  'operatorTin',
  'operatorLicenseNumber',
  'merchantId',
  'merchantName',
  'ethiopiaRevenueOffice',
  'productId',
  'productName',
  'packageLevel',
  'batchNumber',
  'batchId',
  'productionDate',
  'forecastReference',
  'forecastSubmittedAt',
  'requiresSixtyDayForecast',
  'isImported',
  'customsDeclarationNumber',
  'generatedAt',
  'issuedAt',
  'assignedAt',
  'appliedAt',
  'activatedAt',
  'trackedAt',
  'verifiedAt',
  'auditedAt',
  'revokedAt',
  'assignedToOperatorId',
  'applicationLineCode',
  'activationLocationCode',
  'lastKnownLocationCode',
  'lastVerificationResult',
  'enforcementState',
  'notes',
  'metadata',
  'createdAt',
  'updatedAt',
];

const STAMP_LABEL_INCLUDE = [
  {
    model: models.StampLabelBatch,
    as: 'batch',
    attributes: [
      'id',
      'batchNumber',
      'status',
      'totalCount',
      'generatedCount',
      'issuedCount',
      'printedCount',
      'printedAt',
    ],
    required: false,
  },
  {
    model: models.StampLabelTemplate,
    as: 'template',
    attributes: ['id', 'code', 'version', 'lifecycleStatus', 'resolvedBy'],
    required: false,
  },
  {
    model: models.ExciseStampRequest,
    as: 'stampRequest',
    attributes: ['id', 'requestNumber', 'status', 'quantity', 'goodsCategory'],
    required: false,
  },
  {
    model: models.Product,
    as: 'product',
    attributes: ['id', 'name', 'isActive'],
    required: false,
  },
];

export class StampLabelRepository extends BaseRepository {
  constructor() {
    super({ Model: models.StampLabel });
  }

  findAllDetailed(req, queryParams = {}) {
    return this.findAll(
      req,
      {
        attributes: STAMP_LABEL_ATTRIBUTES,
        include: STAMP_LABEL_INCLUDE,
        order: [['updatedAt', 'DESC']],
      },
      queryParams,
    );
  }

  findByIdDetailed(req, id) {
    return this.findById(req, id, {
      attributes: STAMP_LABEL_ATTRIBUTES,
      include: STAMP_LABEL_INCLUDE,
    });
  }

  findByUid(req, stampUid) {
    return this.findOne(
      req,
      {
        stampUid,
      },
      {
        attributes: STAMP_LABEL_ATTRIBUTES,
        include: STAMP_LABEL_INCLUDE,
      },
    );
  }

  findManyByBatchNumber(req, batchNumber) {
    return this.findMany(
      req,
      { batchNumber },
      {
        attributes: STAMP_LABEL_ATTRIBUTES,
        include: STAMP_LABEL_INCLUDE,
        order: [['createdAt', 'ASC']],
      },
    );
  }
}

export class StampLabelEventRepository extends BaseRepository {
  constructor() {
    super({ Model: models.StampLabelEvent });
  }

  listByStampLabelId(req, stampLabelId) {
    return this.findAll(
      req,
      {
        where: { stampLabelId },
        order: [['occurredAt', 'DESC']],
      },
      {
        page: 1,
        limit: 250,
      },
    );
  }

  listByStampLabelIds(req, stampLabelIds) {
    if (!Array.isArray(stampLabelIds) || stampLabelIds.length === 0) {
      return { data: [], count: 0 };
    }

    return this.findAll(
      req,
      {
        where: {
          stampLabelId: {
            [Op.in]: stampLabelIds,
          },
        },
        order: [['occurredAt', 'DESC']],
      },
      {
        page: 1,
        limit: 1000,
      },
    );
  }
}

export class StampLabelBatchRepository extends BaseRepository {
  constructor() {
    super({ Model: models.StampLabelBatch });
  }

  findByBatchNumber(req, batchNumber) {
    return this.findOne(req, { batchNumber });
  }

  findByIdDetailed(req, id) {
    return this.findById(req, id, {
      include: [
        {
          model: models.StampLabel,
          as: 'stamps',
          attributes: ['id', 'stampUid', 'status', 'batchNumber', 'issuedAt'],
          required: false,
        },
      ],
      order: [[{ model: models.StampLabel, as: 'stamps' }, 'createdAt', 'ASC']],
    });
  }
}

const STAMP_TEMPLATE_INCLUDE = [
  {
    model: models.Product,
    as: 'product',
    attributes: ['id', 'name', 'categoryId'],
    required: false,
  },
  {
    model: models.ProductVariant,
    as: 'variant',
    attributes: ['id', 'productId', 'name', 'sku'],
    required: false,
  },
  {
    model: models.Category,
    as: 'category',
    attributes: ['id', 'name', 'code'],
    required: false,
  },
  {
    model: models.StampLabelTemplateSecurityFeature,
    as: 'securityFeatures',
    attributes: ['id', 'templateId', 'featureCode'],
    required: false,
  },
];

export class StampLabelTemplateRepository extends BaseRepository {
  constructor() {
    super({ Model: models.StampLabelTemplate });
  }

  findAllDetailed(req, queryParams = {}) {
    return this.findAll(
      req,
      {
        include: STAMP_TEMPLATE_INCLUDE,
        order: [['updatedAt', 'DESC']],
      },
      queryParams,
    );
  }

  findByIdDetailed(req, id) {
    return this.findById(req, id, {
      include: STAMP_TEMPLATE_INCLUDE,
    });
  }
}
