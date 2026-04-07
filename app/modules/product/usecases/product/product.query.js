import { HttpError } from '../../../../shared/utils/http-error.js';
import { models } from '../../../../shared/db/data-source.js';

export class ProductQueryService {
  /**
   * @param {{ productRepository: import('../../repository/product.repository.js').ProductRepository }} deps
   */
  constructor({ productRepository }) {
    this.productRepository = productRepository;
  }

  listProducts = async (req, queryParams = {}) =>
    this.productRepository.findAllDetailed(req, queryParams);

  listAllVariants = async () =>
    models.ProductVariant.findAll({
      attributes: ['id', 'productId', 'name', 'sku', 'unitValue', 'sellingPrice', 'isActive', 'createdAt', 'updatedAt'],
      include: [
        {
          model: models.Product,
          as: 'product',
          attributes: ['id', 'name', 'imageUrl', 'isActive'],
        },
        {
          model: models.ProductVariantAttribute,
          as: 'attributes',
          attributes: ['id', 'variantId', 'key', 'value'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

  getProductById = async (req, id) => {
    const row = await this.productRepository.findByIdDetailed(req, id);
    if (!row) {
      throw new HttpError(404, 'NOT_FOUND', 'Product not found');
    }
    return row;
  };

  listVariants = async (req, productId) => {
    const product = await this.productRepository.findByIdDetailed(req, productId);
    if (!product) {
      throw new HttpError(404, 'NOT_FOUND', 'Product not found');
    }
    return product.variants || [];
  };

  getVariantById = async (req, productId, variantId) => {
    const product = await this.productRepository.findByIdDetailed(req, productId);
    if (!product) {
      throw new HttpError(404, 'NOT_FOUND', 'Product not found');
    }
    const variant = await models.ProductVariant.findOne({
      where: { id: variantId, productId },
      include: [
        {
          model: models.ProductVariantAttribute,
          as: 'attributes',
          attributes: ['id', 'variantId', 'key', 'value'],
        },
      ],
    });
    if (!variant) {
      throw new HttpError(404, 'NOT_FOUND', 'Variant not found');
    }
    return variant;
  };

  listVariantAttributes = async (req, productId, variantId) => {
    const variant = await this.getVariantById(req, productId, variantId);
    return variant.attributes || [];
  };

  getVariantAttributeById = async (req, productId, variantId, attributeId) => {
    await this.getVariantById(req, productId, variantId);
    const attribute = await models.ProductVariantAttribute.findOne({
      where: { id: attributeId, variantId },
    });
    if (!attribute) {
      throw new HttpError(404, 'NOT_FOUND', 'Variant attribute not found');
    }
    return attribute;
  };
}
