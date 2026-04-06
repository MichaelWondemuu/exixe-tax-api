import { models } from '../../../shared/db/data-source.js';
import { BaseRepository } from '../../../shared/repository/base.repository.js';

const PRODUCT_ATTRIBUTES = [
  'id',
  'name',
  'description',
  'categoryId',
  'productTypeId',
  'measurementId',
  'isActive',
  'imageUrl',
  'createdAt',
  'updatedAt',
];

const PRODUCT_INCLUDES = [
  { model: models.Category, as: 'category', attributes: ['id', 'name'] },
  { model: models.ProductType, as: 'productType', attributes: ['id', 'name'] },
  { model: models.Measurement, as: 'measurement', attributes: ['id', 'name', 'shortForm'] },
  {
    model: models.ProductVariant,
    as: 'variants',
    attributes: [
      'id',
      'productId',
      'name',
      'sku',
      'unitValue',
      'sellingPrice',
      'isActive',
    ],
    include: [
      {
        model: models.ProductVariantAttribute,
        as: 'attributes',
        attributes: ['id', 'variantId', 'key', 'value'],
      },
    ],
  },
];

export class ProductRepository extends BaseRepository {
  constructor() {
    super({ Model: models.Product });
  }

  findVariantBySku(sku) {
    return models.ProductVariant.findOne({ where: { sku } });
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
