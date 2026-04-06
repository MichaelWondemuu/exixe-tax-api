import { HttpError } from '../../../../shared/utils/http-error.js';
import { saveImageToAssets } from '../../../../shared/utils/file-upload.util.js';

function normalizePayload(body = {}) {
  return {
    name: body.name?.trim(),
    description: body.description?.trim() || null,
    sku: body.sku?.trim() || null,
    categoryId: body.categoryId,
    productTypeId: body.productTypeId,
    measurementId: body.measurementId,
    unitValue:
      body.unitValue !== undefined && body.unitValue !== null
        ? Number(body.unitValue)
        : 1,
    sellingPrice:
      body.sellingPrice !== undefined && body.sellingPrice !== null
        ? Number(body.sellingPrice)
        : 0,
    isActive:
      body.isActive !== undefined && body.isActive !== null
        ? Boolean(body.isActive)
        : true,
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

  createProduct = async (req, body, file = null) => {
    const payload = normalizePayload(body);
    if (!payload.name) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'name is required');
    }

    await this.validateReferences(payload);

    if (payload.sku) {
      const existingBySku = await this.productRepository.findBySku(payload.sku);
      if (existingBySku) {
        throw new HttpError(409, 'PRODUCT_SKU_EXISTS', 'SKU already exists');
      }
    }

    const created = await this.productRepository.create(req, payload);
    if (file?.buffer) {
      await this.saveProductImage(req, created.id, file);
      return this.productRepository.findByIdDetailed(req, created.id);
    }
    return created;
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

    if (payload.sku) {
      const existingBySku = await this.productRepository.findBySku(payload.sku);
      if (existingBySku && existingBySku.id !== id) {
        throw new HttpError(409, 'PRODUCT_SKU_EXISTS', 'SKU already exists');
      }
    }

    const updated = await this.productRepository.update(req, id, payload);
    if (!updated) {
      throw new HttpError(404, 'NOT_FOUND', 'Product not found');
    }
    if (file?.buffer) {
      await this.saveProductImage(req, id, file);
      return this.productRepository.findByIdDetailed(req, id);
    }
    return updated;
  };

  deleteProduct = async (req, id) => {
    const deleted = await this.productRepository.delete(req, id);
    if (!deleted) {
      throw new HttpError(404, 'NOT_FOUND', 'Product not found');
    }
    return { message: 'Product deleted successfully' };
  };
}
