import { HttpError } from '../../../../shared/utils/http-error.js';
import { models } from '../../../../shared/db/data-source.js';

export class ProductQueryService {
  /**
   * @param {{
   *   productRepository: import('../../repository/product.repository.js').ProductRepository;
   *   organizationProductRepository: import('../../repository/organization-product.repository.js').OrganizationProductRepository;
   * }} deps
   */
  constructor({ productRepository, organizationProductRepository }) {
    this.productRepository = productRepository;
    this.organizationProductRepository = organizationProductRepository;
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

  listOrganizationProducts = async (req, queryParams = {}) => {
    const organizationId =
      req.organizationId || req['organizationId'] || req.user?.organization?.id;
    if (!organizationId) {
      throw new HttpError(
        400,
        'VALIDATION_ERROR',
        'organization context is required',
      );
    }

    const [base, orgRows] = await Promise.all([
      this.productRepository.findAllDetailed(req, queryParams),
      this.organizationProductRepository.findByOrganization(organizationId),
    ]);

    const baseRows = base?.data || [];
    const overrides = new Map(
      orgRows
        .filter((r) => r.productId)
        .map((r) => [r.productId, r]),
    );
    const customs = orgRows.filter((r) => !r.productId);

    const merged = baseRows.map((p) => {
      const o = overrides.get(p.id);
      if (!o) return p;
      const j = p.toJSON ? p.toJSON() : { ...p };
      return {
        ...j,
        name: o.name ?? j.name,
        description: o.description ?? j.description,
        imageUrl: o.imageUrl ?? j.imageUrl,
        isActive: o.isActive ?? j.isActive,
        organizationProductId: o.id,
      };
    });

    const customRows = customs.map((o) => ({
      id: o.id,
      isOrganizationCustom: true,
      sourceProductId: null,
      organizationId: o.organizationId,
      name: o.name,
      description: o.description,
      imageUrl: o.imageUrl,
      isActive: o.isActive ?? true,
      createdAt: o.createdAt,
      updatedAt: o.updatedAt,
    }));

    return [...merged, ...customRows];
  };

  listOrganizationProductVariants = async (req, orgProductId) => {
    const organizationId =
      req.organizationId || req['organizationId'] || req.user?.organization?.id;
    if (!organizationId) {
      throw new HttpError(
        400,
        'VALIDATION_ERROR',
        'organization context is required',
      );
    }
    const orgProduct = await models.OrganizationProduct.findOne({
      where: { id: orgProductId, organizationId },
      include: [
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
              attributes: ['id', 'name', 'sku', 'unitValue', 'sellingPrice', 'isActive'],
            },
          ],
        },
      ],
    });
    if (!orgProduct) {
      throw new HttpError(404, 'NOT_FOUND', 'Organization product not found');
    }
    return orgProduct.variants || [];
  };

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
