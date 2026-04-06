import { HttpError } from '../../../../shared/utils/http-error.js';

export class CategoryQueryService {
  /**
   * @param {{
   *   categoryRepository: import('../../repository/category.repository.js').CategoryRepository;
   * }} deps
   */
  constructor({ categoryRepository }) {
    this.categoryRepository = categoryRepository;
  }

  listCategories = async () => {
    return this.categoryRepository.findAllListed();
  };

  getCategoryById = async (id) => {
    const row = await this.categoryRepository.findByPkListed(id);
    if (!row) {
      throw new HttpError(404, 'NOT_FOUND', 'Category not found');
    }
    return row;
  };
}
