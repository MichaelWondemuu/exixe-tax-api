import { models } from '../../../shared/db/data-source.js';
import { BaseRepository } from '../../../shared/repository/base.repository.js';

const FORECAST_ATTRIBUTES = [
  'id',
  'forecastNumber',
  'organizationId',
  'facilityId',
  'goodsCategory',
  'startMonth',
  'monthlyPlan',
  'status',
  'submittedAt',
  'createdAt',
  'updatedAt',
];

const FORECAST_INCLUDE = [
  {
    model: models.ExciseFacility,
    as: 'facility',
    attributes: ['id', 'code', 'name', 'facilityType'],
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
        attributes: FORECAST_ATTRIBUTES,
        include: FORECAST_INCLUDE,
        order: [['createdAt', 'DESC']],
      },
      queryParams,
    );
  }

  findByIdDetailed(req, id) {
    return this.findById(req, id, {
      attributes: FORECAST_ATTRIBUTES,
      include: FORECAST_INCLUDE,
    });
  }
}
