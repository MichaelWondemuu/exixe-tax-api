import { HttpError } from '../../../../shared/utils/http-error.js';

export class ProductQueryService {
  /**
   * @param {{ productRepository: import('../../repository/product.repository.js').ProductRepository }} deps
   */
  constructor({ productRepository }) {
    this.productRepository = productRepository;
  }

  listProducts = async (req, queryParams = {}) =>
    this.productRepository.findAllDetailed(req, queryParams);

  getProductById = async (req, id) => {
    const row = await this.productRepository.findByIdDetailed(req, id);
    if (!row) {
      throw new HttpError(404, 'NOT_FOUND', 'Product not found');
    }
    return row;
  };
}
