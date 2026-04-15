import { models } from '../../../shared/db/data-source.js';
import { BaseRepository } from '../../../shared/repository/base.repository.js';

const ITEM_INCLUDE = {
  model: models.PredeclarationItem,
  as: 'items',
  attributes: [
    'id',
    'predeclarationId',
    'productId',
    'productVariantId',
    'packagingId',
    'packageLevel',
    'parentItemId',
    'unitsPerParent',
    'quantity',
    'unitValueSnapshot',
    'sellingPriceSnapshot',
    'remarks',
    'createdAt',
    'updatedAt',
  ],
  include: [
    {
      model: models.Product,
      as: 'product',
      attributes: ['id', 'name', 'imageUrl', 'isActive'],
    },
    {
      model: models.ProductVariant,
      as: 'productVariant',
      attributes: ['id', 'name', 'sku', 'unitValue', 'sellingPrice', 'isActive'],
    },
    {
      model: models.Packaging,
      as: 'packaging',
      attributes: ['id', 'name'],
    },
    {
      model: models.PredeclarationItem,
      as: 'parentItem',
      attributes: ['id', 'packageLevel'],
    },
  ],
};

export class PredeclarationRepository extends BaseRepository {
  constructor() {
    super({ Model: models.Predeclaration });
  }

  findAllDetailed(req, queryParams = {}) {
    return this.findAll(
      req,
      {
        attributes: [
          'id',
          'organizationId',
          'referenceNo',
          'declarationDate',
          'arrivalDate',
          'status',
          'remarks',
          'submittedAt',
          'submittedBy',
          'approvedAt',
          'approvedBy',
          'rejectedAt',
          'rejectedBy',
          'cancelledAt',
          'cancelledBy',
          'createdAt',
          'updatedAt',
        ],
        include: [ITEM_INCLUDE],
        order: [['createdAt', 'DESC']],
      },
      queryParams,
    );
  }

  findByIdDetailed(req, id) {
    return this.findById(req, id, {
      attributes: [
        'id',
        'organizationId',
        'referenceNo',
        'declarationDate',
        'arrivalDate',
        'status',
        'remarks',
        'submittedAt',
        'submittedBy',
        'approvedAt',
        'approvedBy',
        'rejectedAt',
        'rejectedBy',
        'cancelledAt',
        'cancelledBy',
        'createdAt',
        'updatedAt',
      ],
      include: [ITEM_INCLUDE],
    });
  }

  getItemModel() {
    return models.PredeclarationItem;
  }

  getVariantModel() {
    return models.ProductVariant;
  }

  getPackagingModel() {
    return models.Packaging;
  }
}
