import { models } from '../../../shared/db/data-source.js';
import { BaseRepository } from '../../../shared/repository/base.repository.js';

const VERIFICATION_INCLUDE = [
  {
    model: models.ExciseFacility,
    as: 'facility',
  },
];

export class ExciseStampVerificationRepository extends BaseRepository {
  constructor() {
    super({ Model: models.ExciseStampVerification });
  }

  findAllDetailed(req, queryParams = {}) {
    return this.findAll(
      req,
      {
        include: VERIFICATION_INCLUDE,
        order: [['verifiedAt', 'DESC']],
      },
      queryParams,
    );
  }

  findByIdDetailed(req, id) {
    return this.findById(req, id, {
      include: VERIFICATION_INCLUDE,
    });
  }
}
