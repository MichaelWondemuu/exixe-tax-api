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
          model: models.Product,
          as: 'product',
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
      ],
      order: [['createdAt', 'DESC']],
    });
  }

  findOverride(organizationId, productId) {
    return this.Model.findOne({
      where: { organizationId, productId },
    });
  }
}
