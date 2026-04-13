import { models } from '../../../shared/db/data-source.js';
import { BaseRepository } from '../../../shared/repository/base.repository.js';

const FORECAST_INCLUDE = [
  {
    model: models.ExciseFacility,
    as: 'facility',
  },
];

export class ExciseStampForecastRepository extends BaseRepository {
  constructor() {
    super({ Model: models.ExciseStampForecast });
  }

  findAllDetailed(req, queryParams = {}) {
    return this.findAll(
      req,
      {
        include: FORECAST_INCLUDE,
        order: [['createdAt', 'DESC']],
      },
      queryParams,
    );
  }

  findByIdDetailed(req, id) {
    return this.findById(req, id, {
      include: FORECAST_INCLUDE,
    });
  }
}
