import { HttpError } from '../../../../shared/utils/http-error.js';

export class ProductTypeQueryService {
  /**
   * @param {{
   *   productTypeRepository: import('../../repository/product-type.repository.js').ProductTypeRepository;
   * }} deps
   */
  constructor({ productTypeRepository }) {
    this.productTypeRepository = productTypeRepository;
  }

  listProductTypes = async () => this.productTypeRepository.findAllListed();

  getProductTypeById = async (id) => {
    const row = await this.productTypeRepository.findByPkListed(id);
    if (!row) {
      throw new HttpError(404, 'NOT_FOUND', 'Product type not found');
    }
    return row;
  };
}
