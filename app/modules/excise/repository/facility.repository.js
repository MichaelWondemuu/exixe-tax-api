import { models } from '../../../shared/db/data-source.js';
import { BaseRepository } from '../../../shared/repository/base.repository.js';

export class ExciseFacilityRepository extends BaseRepository {
  constructor() {
    super({ Model: models.ExciseFacility });
  }

  findAllDetailed(req, queryParams = {}) {
    return this.findAll(
      req,
      {
        order: [['createdAt', 'DESC']],
      },
      queryParams,
    );
  }

  findByIdDetailed(req, id) {
    return this.findById(req, id, {});
  }
}
