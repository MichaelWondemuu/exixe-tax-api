import { models } from '../../../shared/db/data-source.js';
import { BaseRepository } from '../../../shared/repository/base.repository.js';

const STAMP_REQUEST_INCLUDE = [
  {
    model: models.ExciseFacility,
    as: 'facility',
  },
  {
    model: models.Product,
    as: 'product',
    attributes: ['id', 'name', 'categoryId', 'productTypeId', 'measurementId'],
    include: [
      { model: models.Category, as: 'category', attributes: ['id', 'name', 'code'] },
      { model: models.ProductType, as: 'productType', attributes: ['id', 'name'] },
      { model: models.Measurement, as: 'measurement', attributes: ['id', 'name', 'shortForm'] },
    ],
  },
  {
    model: models.ProductVariant,
    as: 'variant',
    attributes: ['id', 'productId', 'name', 'sku', 'unitValue'],
  },
  {
    model: models.Measurement,
    as: 'uom',
    attributes: ['id', 'name', 'shortForm'],
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
