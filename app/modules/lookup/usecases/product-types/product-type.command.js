import { HttpError } from '../../../../shared/utils/http-error.js';

export class ProductTypeCommandService {
  /**
   * @param {{
   *   productTypeRepository: import('../../repository/product-type.repository.js').ProductTypeRepository;
   * }} deps
   */
  constructor({ productTypeRepository }) {
    this.productTypeRepository = productTypeRepository;
  }

  createProductType = async (body) => {
    const name = body?.name?.trim();
    if (!name) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'name is required');
    }

    const exists = await this.productTypeRepository.findByName(name);
    if (exists) {
      throw new HttpError(
        409,
        'PRODUCT_TYPE_ALREADY_EXISTS',
        `Product type "${name}" already exists`,
      );
    }

    return this.productTypeRepository.create(null, { name });
  };

  updateProductType = async (req, id, body) => {
    const name = body?.name?.trim();
    if (!name) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'name is required');
    }

    const current = await this.productTypeRepository.findByPkListed(id);
    if (!current) {
      throw new HttpError(404, 'NOT_FOUND', 'Product type not found');
    }

    const exists = await this.productTypeRepository.findByName(name);
    if (exists && exists.id !== id) {
      throw new HttpError(
        409,
        'PRODUCT_TYPE_ALREADY_EXISTS',
        `Product type "${name}" already exists`,
      );
    }

    const updated = await this.productTypeRepository.update(req, id, { name });
    if (!updated) {
      throw new HttpError(404, 'NOT_FOUND', 'Product type not found');
    }
    return updated;
  };

  deleteProductType = async (req, id) => {
    const deleted = await this.productTypeRepository.delete(req, id);
    if (!deleted) {
      throw new HttpError(404, 'NOT_FOUND', 'Product type not found');
    }
    return { message: 'Product type deleted successfully' };
  };
}
