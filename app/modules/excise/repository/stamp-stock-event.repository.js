import { models } from '../../../shared/db/data-source.js';
import { BaseRepository } from '../../../shared/repository/base.repository.js';

const STOCK_EVENT_INCLUDE = [
  {
    model: models.ExciseFacility,
    as: 'sourceFacility',
  },
  {
    model: models.ExciseFacility,
    as: 'targetFacility',
  },
  {
    model: models.ExciseStampRequest,
    as: 'relatedStampRequest',
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
        include: STOCK_EVENT_INCLUDE,
        order: [['createdAt', 'DESC']],
      },
      queryParams,
    );
  }

  findByIdDetailed(req, id) {
    return this.findById(req, id, {
      include: STOCK_EVENT_INCLUDE,
    });
  }
}
