import { HttpError } from '../../../../shared/utils/http-error.js';
import { saveImageToAssets } from '../../../../shared/utils/file-upload.util.js';
import { models } from '../../../../shared/db/data-source.js';

function normalizePayload(body = {}) {
  const rawVariants = body.variants;
  let variants;
  if (typeof rawVariants === 'string') {
    try {
      const parsed = JSON.parse(rawVariants);
      variants = Array.isArray(parsed) ? parsed : undefined;
    } catch {
      throw new HttpError(
        400,
        'VALIDATION_ERROR',
        'variants must be valid JSON array',
      );
    }
  } else if (Array.isArray(rawVariants)) {
    variants = rawVariants;
  }

  return {
    name: body.name?.trim(),
    description: body.description?.trim() || null,
    categoryId: body.categoryId,
    productTypeId: body.productTypeId,
    measurementId: body.measurementId,
    isActive:
      body.isActive !== undefined && body.isActive !== null
        ? Boolean(body.isActive)
        : true,
    variants,
  };
}

export class ProductCommandService {
  /**
   * @param {{
   *  productRepository: import('../../repository/product.repository.js').ProductRepository;
   *  organizationProductRepository: import('../../repository/organization-product.repository.js').OrganizationProductRepository;
   *  categoryRepository: import('../../../lookup/repository/category.repository.js').CategoryRepository;
   *  productTypeRepository: import('../../../lookup/repository/product-type.repository.js').ProductTypeRepository;
   *  measurementRepository: import('../../../lookup/repository/measurement.repository.js').MeasurementRepository;
   * }} deps
   */
  constructor({
    productRepository,
    organizationProductRepository,
    categoryRepository,
    productTypeRepository,
    measurementRepository,
  }) {
    this.productRepository = productRepository;
    this.organizationProductRepository = organizationProductRepository;
    this.categoryRepository = categoryRepository;
    this.productTypeRepository = productTypeRepository;
    this.measurementRepository = measurementRepository;
  }

  getOrganizationId(req) {
    const organizationId =
      req.organizationId || req['organizationId'] || req.user?.organization?.id;
    if (!organizationId) {
      throw new HttpError(
        400,
        'VALIDATION_ERROR',
        'organization context is required',
      );
    }
    return organizationId;
  }

  async validateReferences(payload) {
    const [category, productType, measurement] = await Promise.all([
      this.categoryRepository.findByPkListed(payload.categoryId),
      this.productTypeRepository.findByPkListed(payload.productTypeId),
      this.measurementRepository.findByPkListed(payload.measurementId),
    ]);

    if (!category) throw new HttpError(404, 'NOT_FOUND', 'Category not found');
    if (!productType) {
      throw new HttpError(404, 'NOT_FOUND', 'Product type not found');
    }
    if (!measurement) {
      throw new HttpError(404, 'NOT_FOUND', 'Measurement not found');
    }
  }

  saveProductImage = async (req, id, file) => {
    if (!file?.buffer) return null;
    const saved = await saveImageToAssets(file, {
      subDir: 'products',
      filePrefix: `product-${id}`,
    });
    const imageUrl = saved?.relativeUrl || null;
    await this.productRepository.update(req, id, { imageUrl });
    return imageUrl;
  };

  syncVariants = async (productId, variants) => {
    if (!Array.isArray(variants)) return;

    const seenSkus = new Set();
    for (const rawVariant of variants) {
      const sku = rawVariant?.sku ? String(rawVariant.sku).trim() : '';
      if (!sku) {
        throw new HttpError(
          400,
          'VALIDATION_ERROR',
          'variant sku is required',
        );
      }
      if (seenSkus.has(sku)) {
        throw new HttpError(
          409,
          'PRODUCT_VARIANT_SKU_DUPLICATE',
          `Duplicate variant sku in payload: ${sku}`,
        );
      }
      seenSkus.add(sku);
    }

    const existingVariants = await models.ProductVariant.findAll({
      where: { productId },
      attributes: ['id'],
    });
    const variantIds = existingVariants.map((v) => v.id);
    if (variantIds.length > 0) {
      await models.ProductVariantAttribute.destroy({
        where: { variantId: variantIds },
      });
    }

    await models.ProductVariant.destroy({ where: { productId } });

    for (const rawVariant of variants) {
      const name = rawVariant?.name ? String(rawVariant.name).trim() : '';
      if (!name) continue;

      const variant = await models.ProductVariant.create({
        productId,
        name,
        sku: String(rawVariant.sku).trim(),
        unitValue:
          rawVariant?.unitValue !== undefined && rawVariant?.unitValue !== null
            ? Number(rawVariant.unitValue)
            : 1,
        sellingPrice:
          rawVariant?.sellingPrice !== undefined &&
          rawVariant?.sellingPrice !== null
            ? Number(rawVariant.sellingPrice)
            : 0,
        isActive:
          rawVariant?.isActive !== undefined && rawVariant?.isActive !== null
            ? Boolean(rawVariant.isActive)
            : true,
      });

      const attrs = Array.isArray(rawVariant?.attributes)
        ? rawVariant.attributes
        : [];
      for (const rawAttr of attrs) {
        const key = rawAttr?.key ? String(rawAttr.key).trim() : '';
        const value = rawAttr?.value ? String(rawAttr.value).trim() : '';
        if (!key || !value) continue;
        await models.ProductVariantAttribute.create({
          variantId: variant.id,
          key,
          value,
        });
      }
    }
  };

  createProduct = async (req, body, file = null) => {
    const payload = normalizePayload(body);
    if (!payload.name) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'name is required');
    }

    await this.validateReferences(payload);

    if (!Array.isArray(payload.variants) || payload.variants.length === 0) {
      throw new HttpError(
        400,
        'VALIDATION_ERROR',
        'At least one variant is required',
      );
    }
    for (const rawVariant of payload.variants) {
      const sku = rawVariant?.sku ? String(rawVariant.sku).trim() : '';
      if (!sku) continue;
      const existingBySku = await this.productRepository.findVariantBySku(sku);
      if (existingBySku) {
        throw new HttpError(
          409,
          'PRODUCT_VARIANT_SKU_EXISTS',
          `Variant SKU already exists: ${sku}`,
        );
      }
    }

    const { variants, ...productData } = payload;
    const created = await this.productRepository.create(req, productData);
    await this.syncVariants(created.id, variants);
    if (file?.buffer) {
      await this.saveProductImage(req, created.id, file);
    }
    return this.productRepository.findByIdDetailed(req, created.id);
  };

  updateProduct = async (req, id, body, file = null) => {
    const current = await this.productRepository.findByIdDetailed(req, id);
    if (!current) {
      throw new HttpError(404, 'NOT_FOUND', 'Product not found');
    }

    const payload = normalizePayload(body);
    if (!payload.name) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'name is required');
    }

    await this.validateReferences(payload);

    if (Array.isArray(payload.variants)) {
      for (const rawVariant of payload.variants) {
        const sku = rawVariant?.sku ? String(rawVariant.sku).trim() : '';
        if (!sku) continue;
        const existingBySku = await this.productRepository.findVariantBySku(sku);
        if (existingBySku && existingBySku.productId !== id) {
          throw new HttpError(
            409,
            'PRODUCT_VARIANT_SKU_EXISTS',
            `Variant SKU already exists: ${sku}`,
          );
        }
      }
    }

    const { variants, ...productData } = payload;
    const updated = await this.productRepository.update(req, id, productData);
    if (!updated) {
      throw new HttpError(404, 'NOT_FOUND', 'Product not found');
    }
    if (Array.isArray(variants)) {
      await this.syncVariants(id, variants);
    }
    if (file?.buffer) {
      await this.saveProductImage(req, id, file);
    }
    return this.productRepository.findByIdDetailed(req, id);
  };

  deleteProduct = async (req, id) => {
    const deleted = await this.productRepository.delete(req, id);
    if (!deleted) {
      throw new HttpError(404, 'NOT_FOUND', 'Product not found');
    }
    return { message: 'Product deleted successfully' };
  };

  createVariant = async (req, productId, body) => {
    const product = await this.productRepository.findByIdDetailed(req, productId);
    if (!product) {
      throw new HttpError(404, 'NOT_FOUND', 'Product not found');
    }

    const sku = body?.sku ? String(body.sku).trim() : '';
    if (!sku) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'variant sku is required');
    }
    const name = body?.name ? String(body.name).trim() : '';
    if (!name) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'variant name is required');
    }

    const existing = await this.productRepository.findVariantBySku(sku);
    if (existing) {
      throw new HttpError(
        409,
        'PRODUCT_VARIANT_SKU_EXISTS',
        `Variant SKU already exists: ${sku}`,
      );
    }

    const variant = await models.ProductVariant.create({
      productId,
      name,
      sku,
      unitValue:
        body?.unitValue !== undefined && body?.unitValue !== null
          ? Number(body.unitValue)
          : 1,
      sellingPrice:
        body?.sellingPrice !== undefined && body?.sellingPrice !== null
          ? Number(body.sellingPrice)
          : 0,
      isActive:
        body?.isActive !== undefined && body?.isActive !== null
          ? Boolean(body.isActive)
          : true,
    });

    const attrs = Array.isArray(body?.attributes) ? body.attributes : [];
    for (const rawAttr of attrs) {
      const key = rawAttr?.key ? String(rawAttr.key).trim() : '';
      const value = rawAttr?.value ? String(rawAttr.value).trim() : '';
      if (!key || !value) continue;
      await models.ProductVariantAttribute.create({
        variantId: variant.id,
        key,
        value,
      });
    }

    return models.ProductVariant.findByPk(variant.id, {
      include: [
        {
          model: models.ProductVariantAttribute,
          as: 'attributes',
          attributes: ['id', 'variantId', 'key', 'value'],
        },
      ],
    });
  };

  updateVariant = async (req, productId, variantId, body) => {
    const variant = await models.ProductVariant.findOne({
      where: { id: variantId, productId },
    });
    if (!variant) {
      throw new HttpError(404, 'NOT_FOUND', 'Variant not found');
    }

    if (body?.name !== undefined) {
      const name = String(body.name || '').trim();
      if (!name) {
        throw new HttpError(400, 'VALIDATION_ERROR', 'variant name is required');
      }
      variant.name = name;
    }

    if (body?.sku !== undefined) {
      const sku = String(body.sku || '').trim();
      if (!sku) {
        throw new HttpError(400, 'VALIDATION_ERROR', 'variant sku is required');
      }
      const existing = await this.productRepository.findVariantBySku(sku);
      if (existing && existing.id !== variantId) {
        throw new HttpError(
          409,
          'PRODUCT_VARIANT_SKU_EXISTS',
          `Variant SKU already exists: ${sku}`,
        );
      }
      variant.sku = sku;
    }

    if (body?.unitValue !== undefined) {
      variant.unitValue = Number(body.unitValue);
    }
    if (body?.sellingPrice !== undefined) {
      variant.sellingPrice = Number(body.sellingPrice);
    }
    if (body?.isActive !== undefined) {
      variant.isActive = Boolean(body.isActive);
    }

    await variant.save();

    if (Array.isArray(body?.attributes)) {
      await models.ProductVariantAttribute.destroy({ where: { variantId } });
      for (const rawAttr of body.attributes) {
        const key = rawAttr?.key ? String(rawAttr.key).trim() : '';
        const value = rawAttr?.value ? String(rawAttr.value).trim() : '';
        if (!key || !value) continue;
        await models.ProductVariantAttribute.create({
          variantId,
          key,
          value,
        });
      }
    }

    return models.ProductVariant.findByPk(variantId, {
      include: [
        {
          model: models.ProductVariantAttribute,
          as: 'attributes',
          attributes: ['id', 'variantId', 'key', 'value'],
        },
      ],
    });
  };

  deleteVariant = async (_req, productId, variantId) => {
    const variant = await models.ProductVariant.findOne({
      where: { id: variantId, productId },
    });
    if (!variant) {
      throw new HttpError(404, 'NOT_FOUND', 'Variant not found');
    }
    await models.ProductVariantAttribute.destroy({ where: { variantId } });
    await variant.destroy();
    return { message: 'Variant deleted successfully' };
  };

  createVariantAttribute = async (_req, productId, variantId, body) => {
    const variant = await models.ProductVariant.findOne({
      where: { id: variantId, productId },
    });
    if (!variant) {
      throw new HttpError(404, 'NOT_FOUND', 'Variant not found');
    }
    const key = body?.key ? String(body.key).trim() : '';
    const value = body?.value ? String(body.value).trim() : '';
    if (!key || !value) {
      throw new HttpError(
        400,
        'VALIDATION_ERROR',
        'attribute key and value are required',
      );
    }
    return models.ProductVariantAttribute.create({
      variantId,
      key,
      value,
    });
  };

  updateVariantAttribute = async (
    _req,
    productId,
    variantId,
    attributeId,
    body,
  ) => {
    const variant = await models.ProductVariant.findOne({
      where: { id: variantId, productId },
    });
    if (!variant) {
      throw new HttpError(404, 'NOT_FOUND', 'Variant not found');
    }
    const attr = await models.ProductVariantAttribute.findOne({
      where: { id: attributeId, variantId },
    });
    if (!attr) {
      throw new HttpError(404, 'NOT_FOUND', 'Variant attribute not found');
    }
    if (body?.key !== undefined) {
      const key = String(body.key || '').trim();
      if (!key) {
        throw new HttpError(400, 'VALIDATION_ERROR', 'attribute key is required');
      }
      attr.key = key;
    }
    if (body?.value !== undefined) {
      const value = String(body.value || '').trim();
      if (!value) {
        throw new HttpError(
          400,
          'VALIDATION_ERROR',
          'attribute value is required',
        );
      }
      attr.value = value;
    }
    await attr.save();
    return attr;
  };

  deleteVariantAttribute = async (_req, productId, variantId, attributeId) => {
    const variant = await models.ProductVariant.findOne({
      where: { id: variantId, productId },
    });
    if (!variant) {
      throw new HttpError(404, 'NOT_FOUND', 'Variant not found');
    }
    const attr = await models.ProductVariantAttribute.findOne({
      where: { id: attributeId, variantId },
    });
    if (!attr) {
      throw new HttpError(404, 'NOT_FOUND', 'Variant attribute not found');
    }
    await attr.destroy();
    return { message: 'Variant attribute deleted successfully' };
  };

  upsertOrganizationProductOverride = async (req, productId, body) => {
    const organizationId = this.getOrganizationId(req);
    const product = await this.productRepository.findByIdDetailed(req, productId);
    if (!product) {
      throw new HttpError(404, 'NOT_FOUND', 'Product not found');
    }

    const payload = {
      name: body?.name !== undefined ? String(body.name || '').trim() || null : undefined,
      description:
        body?.description !== undefined
          ? String(body.description || '').trim() || null
          : undefined,
      imageUrl:
        body?.imageUrl !== undefined
          ? String(body.imageUrl || '').trim() || null
          : undefined,
      isActive: body?.isActive !== undefined ? Boolean(body.isActive) : undefined,
    };
    const clean = Object.fromEntries(
      Object.entries(payload).filter(([, v]) => v !== undefined),
    );
    if (Object.keys(clean).length === 0) {
      throw new HttpError(
        400,
        'VALIDATION_ERROR',
        'At least one override field is required',
      );
    }

    const existing = await this.organizationProductRepository.findOverride(
      organizationId,
      productId,
    );
    if (existing) {
      await existing.update(clean);
      return existing;
    }
    return this.organizationProductRepository.getModel().create({
      organizationId,
      productId,
      ...clean,
    });
  };

  createOrganizationCustomProduct = async (req, body) => {
    const organizationId = this.getOrganizationId(req);
    const name = body?.name ? String(body.name).trim() : '';
    if (!name) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'name is required');
    }
    return this.organizationProductRepository.getModel().create({
      organizationId,
      productId: null,
      name,
      description:
        body?.description !== undefined
          ? String(body.description || '').trim() || null
          : null,
      imageUrl:
        body?.imageUrl !== undefined
          ? String(body.imageUrl || '').trim() || null
          : null,
      isActive: body?.isActive !== undefined ? Boolean(body.isActive) : true,
    });
  };

  updateOrganizationProduct = async (req, orgProductId, body) => {
    const organizationId = this.getOrganizationId(req);
    const row = await this.organizationProductRepository.getModel().findOne({
      where: { id: orgProductId, organizationId },
    });
    if (!row) {
      throw new HttpError(404, 'NOT_FOUND', 'Organization product not found');
    }
    const payload = {};
    if (body?.name !== undefined) {
      payload.name = String(body.name || '').trim() || null;
    }
    if (body?.description !== undefined) {
      payload.description = String(body.description || '').trim() || null;
    }
    if (body?.imageUrl !== undefined) {
      payload.imageUrl = String(body.imageUrl || '').trim() || null;
    }
    if (body?.isActive !== undefined) {
      payload.isActive = Boolean(body.isActive);
    }
    if (Object.keys(payload).length === 0) {
      throw new HttpError(
        400,
        'VALIDATION_ERROR',
        'At least one field is required',
      );
    }
    await row.update(payload);
    return row;
  };

  deleteOrganizationProduct = async (req, orgProductId) => {
    const organizationId = this.getOrganizationId(req);
    const row = await this.organizationProductRepository.getModel().findOne({
      where: { id: orgProductId, organizationId },
    });
    if (!row) {
      throw new HttpError(404, 'NOT_FOUND', 'Organization product not found');
    }
    await row.destroy();
    return { message: 'Organization product removed successfully' };
  };

  createOrganizationProductVariant = async (req, orgProductId, body) => {
    const organizationId = this.getOrganizationId(req);
    const orgProduct = await this.organizationProductRepository.getModel().findOne({
      where: { id: orgProductId, organizationId },
    });
    if (!orgProduct) {
      throw new HttpError(404, 'NOT_FOUND', 'Organization product not found');
    }
    const row = await models.OrganizationProductVariant.create({
      organizationProductId: orgProductId,
      productVariantId: body?.productVariantId || null,
      name: body?.name ? String(body.name).trim() : null,
      sku: body?.sku ? String(body.sku).trim() : null,
      unitValue:
        body?.unitValue !== undefined && body?.unitValue !== null
          ? Number(body.unitValue)
          : null,
      sellingPrice:
        body?.sellingPrice !== undefined && body?.sellingPrice !== null
          ? Number(body.sellingPrice)
          : null,
      isActive: body?.isActive !== undefined ? Boolean(body.isActive) : null,
    });
    return row;
  };

  updateOrganizationProductVariant = async (req, orgProductVariantId, body) => {
    const organizationId = this.getOrganizationId(req);
    const row = await models.OrganizationProductVariant.findOne({
      where: { id: orgProductVariantId },
      include: [
        {
          model: models.OrganizationProduct,
          as: 'organizationProduct',
          where: { organizationId },
        },
      ],
    });
    if (!row) {
      throw new HttpError(
        404,
        'NOT_FOUND',
        'Organization product variant not found',
      );
    }
    const payload = {};
    if (body?.name !== undefined) payload.name = String(body.name || '').trim() || null;
    if (body?.sku !== undefined) payload.sku = String(body.sku || '').trim() || null;
    if (body?.unitValue !== undefined) {
      payload.unitValue = body.unitValue == null ? null : Number(body.unitValue);
    }
    if (body?.sellingPrice !== undefined) {
      payload.sellingPrice =
        body.sellingPrice == null ? null : Number(body.sellingPrice);
    }
    if (body?.isActive !== undefined) payload.isActive = Boolean(body.isActive);
    if (Object.keys(payload).length === 0) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'At least one field is required');
    }
    await row.update(payload);
    return row;
  };

  deleteOrganizationProductVariant = async (req, orgProductVariantId) => {
    const organizationId = this.getOrganizationId(req);
    const row = await models.OrganizationProductVariant.findOne({
      where: { id: orgProductVariantId },
      include: [
        {
          model: models.OrganizationProduct,
          as: 'organizationProduct',
          where: { organizationId },
        },
      ],
    });
    if (!row) {
      throw new HttpError(
        404,
        'NOT_FOUND',
        'Organization product variant not found',
      );
    }
    await models.OrganizationProductVariantAttribute.destroy({
      where: { organizationProductVariantId: row.id },
    });
    await row.destroy();
    return { message: 'Organization product variant removed successfully' };
  };

  createOrganizationProductVariantAttribute = async (
    req,
    orgProductVariantId,
    body,
  ) => {
    const organizationId = this.getOrganizationId(req);
    const variant = await models.OrganizationProductVariant.findOne({
      where: { id: orgProductVariantId },
      include: [
        {
          model: models.OrganizationProduct,
          as: 'organizationProduct',
          where: { organizationId },
        },
      ],
    });
    if (!variant) {
      throw new HttpError(
        404,
        'NOT_FOUND',
        'Organization product variant not found',
      );
    }
    const key = body?.key ? String(body.key).trim() : '';
    const value = body?.value ? String(body.value).trim() : '';
    if (!key || !value) {
      throw new HttpError(
        400,
        'VALIDATION_ERROR',
        'attribute key and value are required',
      );
    }
    return models.OrganizationProductVariantAttribute.create({
      organizationProductVariantId: orgProductVariantId,
      key,
      value,
    });
  };

  updateOrganizationProductVariantAttribute = async (
    req,
    orgProductVariantAttributeId,
    body,
  ) => {
    const organizationId = this.getOrganizationId(req);
    const row = await models.OrganizationProductVariantAttribute.findOne({
      where: { id: orgProductVariantAttributeId },
      include: [
        {
          model: models.OrganizationProductVariant,
          as: 'organizationProductVariant',
          include: [
            {
              model: models.OrganizationProduct,
              as: 'organizationProduct',
              where: { organizationId },
            },
          ],
        },
      ],
    });
    if (!row) {
      throw new HttpError(
        404,
        'NOT_FOUND',
        'Organization product variant attribute not found',
      );
    }
    if (body?.key !== undefined) {
      const key = String(body.key || '').trim();
      if (!key) throw new HttpError(400, 'VALIDATION_ERROR', 'key is required');
      row.key = key;
    }
    if (body?.value !== undefined) {
      const value = String(body.value || '').trim();
      if (!value) {
        throw new HttpError(400, 'VALIDATION_ERROR', 'value is required');
      }
      row.value = value;
    }
    await row.save();
    return row;
  };

  deleteOrganizationProductVariantAttribute = async (
    req,
    orgProductVariantAttributeId,
  ) => {
    const organizationId = this.getOrganizationId(req);
    const row = await models.OrganizationProductVariantAttribute.findOne({
      where: { id: orgProductVariantAttributeId },
      include: [
        {
          model: models.OrganizationProductVariant,
          as: 'organizationProductVariant',
          include: [
            {
              model: models.OrganizationProduct,
              as: 'organizationProduct',
              where: { organizationId },
            },
          ],
        },
      ],
    });
    if (!row) {
      throw new HttpError(
        404,
        'NOT_FOUND',
        'Organization product variant attribute not found',
      );
    }
    await row.destroy();
    return { message: 'Organization product variant attribute removed successfully' };
  };
}
