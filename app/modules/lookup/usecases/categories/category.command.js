import { HttpError } from '../../../../shared/utils/http-error.js';

export class CategoryCommandService {
  /**
   * @param {{
   *   categoryRepository: import('../../repository/category.repository.js').CategoryRepository;
   * }} deps
   */
  constructor({ categoryRepository }) {
    this.categoryRepository = categoryRepository;
  }

  createCategory = async (body) => {
    const name = body?.name?.trim();
    if (!name) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'name is required');
    }

    const exists = await this.categoryRepository.findByName(name);
    if (exists) {
      throw new HttpError(
        409,
        'CATEGORY_ALREADY_EXISTS',
        `Category "${name}" already exists`,
      );
    }

    const row = await this.categoryRepository.create(null, { name });
    return { data: row };
  };

  updateCategory = async (req, id, body) => {
    const name = body?.name?.trim();
    if (!name) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'name is required');
    }

    const current = await this.categoryRepository.findByPkListed(id);
    if (!current) {
      throw new HttpError(404, 'NOT_FOUND', 'Category not found');
    }

    const exists = await this.categoryRepository.findByName(name);
    if (exists && exists.id !== id) {
      throw new HttpError(
        409,
        'CATEGORY_ALREADY_EXISTS',
        `Category "${name}" already exists`,
      );
    }

    const updated = await this.categoryRepository.update(req, id, { name });
    if (!updated) {
      throw new HttpError(404, 'NOT_FOUND', 'Category not found');
    }
    return { data: updated };
  };

  deleteCategory = async (req, id) => {
    const deleted = await this.categoryRepository.delete(req, id);
    if (!deleted) {
      throw new HttpError(404, 'NOT_FOUND', 'Category not found');
    }
    return { message: 'Category deleted successfully' };
  };
}
