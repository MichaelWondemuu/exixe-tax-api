import { models } from '../../../shared/db/data-source.js';
import { BaseRepository } from '../../../shared/repository/base.repository.js';

const STAMP_REQUEST_INCLUDE = [
  {
    model: models.ExciseFacility,
    as: 'facility',
  },
];

export class ExciseStampRequestRepository extends BaseRepository {
  constructor() {
    super({ Model: models.ExciseStampRequest });
  }

  findAllDetailed(req, queryParams = {}) {
    return this.findAll(
      req,
      {
        include: STAMP_REQUEST_INCLUDE,
        order: [['createdAt', 'DESC']],
      },
      queryParams,
    );
  }

  findByIdDetailed(req, id) {
    return this.findById(req, id, {
      include: STAMP_REQUEST_INCLUDE,
    });
  }
}
