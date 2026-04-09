import { models } from '../../../shared/db/data-source.js';
import { BaseRepository } from '../../../shared/repository/base.repository.js';

const STAMP_LABEL_ATTRIBUTES = [
  'id',
  'organizationId',
  'stampUid',
  'digitalLink',
  'codeFormat',
  'status',
  'operatorType',
  'operatorName',
  'operatorTin',
  'operatorLicenseNumber',
  'ethiopiaRevenueOffice',
  'productId',
  'productName',
  'packageLevel',
  'batchNumber',
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
}
