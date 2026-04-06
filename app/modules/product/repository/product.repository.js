import { models } from '../../../shared/db/data-source.js';
import { BaseRepository } from '../../../shared/repository/base.repository.js';

const PRODUCT_ATTRIBUTES = [
  'id',
  'name',
  'description',
  'sku',
  'categoryId',
  'productTypeId',
  'measurementId',
  'unitValue',
  'sellingPrice',
  'isActive',
  'imageUrl',
  'createdAt',
  'updatedAt',
];

const PRODUCT_INCLUDES = [
  { model: models.Category, as: 'category', attributes: ['id', 'name'] },
  { model: models.ProductType, as: 'productType', attributes: ['id', 'name'] },
  { model: models.Measurement, as: 'measurement', attributes: ['id', 'name', 'shortForm'] },
];

export class ProductRepository extends BaseRepository {
  constructor() {
    super({ Model: models.Product });
  }

  findBySku(sku) {
    return this.Model.findOne({ where: { sku } });
  }

  findAllDetailed(req, queryParams = {}) {
    return this.findAll(
      req,
      {
        attributes: PRODUCT_ATTRIBUTES,
        include: PRODUCT_INCLUDES,
        order: [['name', 'ASC']],
      },
      queryParams,
    );
  }

  findByIdDetailed(req, id) {
    return this.findById(req, id, {
      attributes: PRODUCT_ATTRIBUTES,
      include: PRODUCT_INCLUDES,
    });
  }
}
