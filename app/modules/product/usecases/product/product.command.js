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
   *  categoryRepository: import('../../../lookup/repository/category.repository.js').CategoryRepository;
   *  productTypeRepository: import('../../../lookup/repository/product-type.repository.js').ProductTypeRepository;
   *  measurementRepository: import('../../../lookup/repository/measurement.repository.js').MeasurementRepository;
   * }} deps
   */
  constructor({
    productRepository,
    categoryRepository,
    productTypeRepository,
    measurementRepository,
  }) {
    this.productRepository = productRepository;
    this.categoryRepository = categoryRepository;
    this.productTypeRepository = productTypeRepository;
    this.measurementRepository = measurementRepository;
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
}
