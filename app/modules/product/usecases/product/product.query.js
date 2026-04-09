import { HttpError } from '../../../../shared/utils/http-error.js';
import { models } from '../../../../shared/db/data-source.js';

export function mergeVariantAttributes(baseAttributes = [], orgAttributes = []) {
  const base = (baseAttributes || []).map((attr) =>
    attr?.toJSON ? attr.toJSON() : { ...attr },
  );
  const org = (orgAttributes || []).map((attr) =>
    attr?.toJSON ? attr.toJSON() : { ...attr },
  );

  if (!org.length) return base;

  const byKey = new Map(base.map((attr) => [String(attr.key || '').toLowerCase(), attr]));
  for (const attr of org) {
    const key = String(attr.key || '').toLowerCase();
    byKey.set(key, {
      ...(byKey.get(key) || {}),
      ...attr,
    });
  }
  return Array.from(byKey.values());
}

export function mergeVariants(baseVariants = [], orgVariants = []) {
  const base = (baseVariants || []).map((variant) =>
    variant?.toJSON ? variant.toJSON() : { ...variant },
  );
  const org = (orgVariants || []).map((variant) =>
    variant?.toJSON ? variant.toJSON() : { ...variant },
  );

  if (!org.length) return base;

  const byBaseId = new Map(base.map((variant) => [variant.id, variant]));
  const result = [...base];

  for (const orgVariant of org) {
    const sourceBase =
      orgVariant.productVariant ||
      (orgVariant.productVariantId ? byBaseId.get(orgVariant.productVariantId) : null);
    const orgAttrs = orgVariant.attributes || [];

    if (sourceBase) {
      const baseAttrs = sourceBase.attributes || [];
      const merged = {
        ...sourceBase,
        name: orgVariant.name ?? sourceBase.name,
        sku: orgVariant.sku ?? sourceBase.sku,
        unitValue: orgVariant.unitValue ?? sourceBase.unitValue,
        sellingPrice: orgVariant.sellingPrice ?? sourceBase.sellingPrice,
        isActive: orgVariant.isActive ?? sourceBase.isActive,
        organizationProductVariantId: orgVariant.id,
        attributes: mergeVariantAttributes(baseAttrs, orgAttrs),
      };

      const existingIndex = result.findIndex((variant) => variant.id === sourceBase.id);
      if (existingIndex >= 0) {
        result[existingIndex] = merged;
      } else {
        result.push(merged);
      }
      continue;
    }

    result.push({
      id: orgVariant.id,
      isOrganizationCustom: true,
      sourceVariantId: orgVariant.productVariantId || null,
      name: orgVariant.name,
      sku: orgVariant.sku,
      unitValue: orgVariant.unitValue,
      sellingPrice: orgVariant.sellingPrice,
      isActive: orgVariant.isActive ?? true,
      organizationProductVariantId: orgVariant.id,
      attributes: mergeVariantAttributes([], orgAttrs),
    });
  }

  return result;
}

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

  mergeVariantAttributes = mergeVariantAttributes;

  mergeVariants = mergeVariants;

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
        variants: mergeVariants(j.variants || [], o.variants || []),
      };
    });

    const customRows = customs.map((o) => {
      const j = o.toJSON ? o.toJSON() : o;
      return {
        id: j.id,
        isOrganizationCustom: true,
        sourceProductId: null,
        organizationId: j.organizationId,
        name: j.name,
        description: j.description,
        imageUrl: j.imageUrl,
        isActive: j.isActive ?? true,
        categoryId: j.categoryId ?? null,
        category: j.category ?? null,
        productTypeId: j.productTypeId ?? null,
        productType: j.productType ?? null,
        measurementId: j.measurementId ?? null,
        measurement: j.measurement ?? null,
        createdAt: j.createdAt,
        updatedAt: j.updatedAt,
        variants: mergeVariants([], o.variants || []),
      };
    });

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
          model: models.Product,
          as: 'product',
          attributes: ['id'],
          include: [
            {
              model: models.ProductVariant,
              as: 'variants',
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
    const baseVariants = orgProduct.product?.variants || [];
    const orgVariants = orgProduct.variants || [];
    return this.mergeVariants(baseVariants, orgVariants);
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
