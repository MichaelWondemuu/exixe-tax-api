import { models } from '../../../shared/db/data-source.js';
import { BaseRepository } from '../../../shared/repository/base.repository.js';

export class OrganizationProductRepository extends BaseRepository {
  constructor() {
    super({ Model: models.OrganizationProduct });
  }

  findByOrganization(organizationId) {
    return this.Model.findAll({
      where: { organizationId },
      include: [
        {
          model: models.Category,
          as: 'category',
          attributes: ['id', 'name'],
          required: false,
        },
        {
          model: models.ProductType,
          as: 'productType',
          attributes: ['id', 'name'],
          required: false,
        },
        {
          model: models.Measurement,
          as: 'measurement',
          attributes: ['id', 'name', 'shortForm'],
          required: false,
        },
        {
          model: models.Product,
          as: 'product',
          required: false,
          include: [
            { model: models.Category, as: 'category', attributes: ['id', 'name'] },
            { model: models.ProductType, as: 'productType', attributes: ['id', 'name'] },
            { model: models.Measurement, as: 'measurement', attributes: ['id', 'name', 'shortForm'] },
            {
              model: models.ProductVariant,
              as: 'variants',
              include: [
                {
                  model: models.ProductVariantAttribute,
                  as: 'attributes',
                  attributes: ['id', 'variantId', 'key', 'value'],
                },
              ],
            },
          ],
        },
        {
          model: models.OrganizationProductVariant,
          as: 'variants',
          include: [
            {
              model: models.OrganizationProductVariantAttribute,
              as: 'attributes',
              attributes: ['id', 'organizationProductVariantId', 'key', 'value'],
            },
            {
              model: models.ProductVariant,
              as: 'productVariant',
              attributes: ['id', 'productId', 'name', 'sku', 'unitValue', 'sellingPrice', 'isActive'],
              include: [
                {
                  model: models.ProductVariantAttribute,
                  as: 'attributes',
                  attributes: ['id', 'variantId', 'key', 'value'],
                },
              ],
            },
          ],
        },
      ],
      order: [['createdAt', 'DESC']],
    });
  }

  findByIdForOrganization(organizationId, id) {
    return this.Model.findOne({
      where: { id, organizationId },
      include: [
        {
          model: models.Category,
          as: 'category',
          attributes: ['id', 'name'],
          required: false,
        },
        {
          model: models.ProductType,
          as: 'productType',
          attributes: ['id', 'name'],
          required: false,
        },
        {
          model: models.Measurement,
          as: 'measurement',
          attributes: ['id', 'name', 'shortForm'],
          required: false,
        },
        {
          model: models.OrganizationProductVariant,
          as: 'variants',
          include: [
            {
              model: models.OrganizationProductVariantAttribute,
              as: 'attributes',
              attributes: ['id', 'organizationProductVariantId', 'key', 'value'],
            },
          ],
        },
      ],
    });
  }

  findOverride(organizationId, productId) {
    return this.Model.findOne({
      where: { organizationId, productId },
    });
  }
}
