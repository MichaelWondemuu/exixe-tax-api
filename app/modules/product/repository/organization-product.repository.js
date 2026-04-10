import { models } from '../../../shared/db/data-source.js';
import { BaseRepository } from '../../../shared/repository/base.repository.js';

export class OrganizationProductRepository extends BaseRepository {
  constructor() {
    super({ Model: models.OrganizationProduct });
  }

  /**
   * Org-scoped rows + org variants only. Does not join `products` (avoids JOIN quirks
   * that can drop override rows or duplicate parents when many variants/attributes exist).
   * Global catalog for overrides is merged from `ProductRepository.findAllDetailed` + `findByIdDetailed`.
   */
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
          model: models.OrganizationProductVariant,
          as: 'variants',
          required: false,
          separate: true,
          order: [['createdAt', 'ASC']],
          include: [
            {
              model: models.OrganizationProductVariantAttribute,
              as: 'attributes',
              attributes: ['id', 'organizationProductVariantId', 'key', 'value'],
              required: false,
            },
            {
              model: models.ProductVariant,
              as: 'productVariant',
              attributes: ['id', 'productId', 'name', 'sku', 'unitValue', 'sellingPrice', 'isActive'],
              required: false,
              include: [
                {
                  model: models.ProductVariantAttribute,
                  as: 'attributes',
                  attributes: ['id', 'variantId', 'key', 'value'],
                  required: false,
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
