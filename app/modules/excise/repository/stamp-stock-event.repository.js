import { models } from '../../../shared/db/data-source.js';
import { BaseRepository } from '../../../shared/repository/base.repository.js';

const STOCK_EVENT_ATTRIBUTES = [
  'id',
  'eventNumber',
  'organizationId',
  'eventType',
  'status',
  'relatedStampRequestId',
  'sourceFacilityId',
  'targetFacilityId',
  'reasonCode',
  'quantity',
  'notes',
  'evidenceUrl',
  'requestedAt',
  'approvedAt',
  'approvedByUserId',
  'completedAt',
  'rejectionReason',
  'meta',
  'createdAt',
  'updatedAt',
];

const STOCK_EVENT_INCLUDE = [
  {
    model: models.ExciseFacility,
    as: 'sourceFacility',
    attributes: ['id', 'code', 'name', 'facilityType'],
  },
  {
    model: models.ExciseFacility,
    as: 'targetFacility',
    attributes: ['id', 'code', 'name', 'facilityType'],
  },
  {
    model: models.ExciseStampRequest,
    as: 'relatedStampRequest',
    attributes: ['id', 'requestNumber', 'quantity', 'status'],
  },
];

export class ExciseStampStockEventRepository extends BaseRepository {
  constructor() {
    super({ Model: models.ExciseStampStockEvent });
  }

  findAllDetailed(req, queryParams = {}) {
    return this.findAll(
      req,
      {
        attributes: STOCK_EVENT_ATTRIBUTES,
        include: STOCK_EVENT_INCLUDE,
        order: [['createdAt', 'DESC']],
      },
      queryParams,
    );
  }

  findByIdDetailed(req, id) {
    return this.findById(req, id, {
      attributes: STOCK_EVENT_ATTRIBUTES,
      include: STOCK_EVENT_INCLUDE,
    });
  }
}
