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
    const code = body?.code?.trim();
    const status = (body?.status || 'ACTIVE').toUpperCase();
    const color = body?.color?.trim() || null;
    const description = body?.description?.trim() || null;
    if (!name) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'name is required');
    }
    if (!code) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'code is required');
    }

    const exists = await this.categoryRepository.findByName(name);
    if (exists) {
      throw new HttpError(
        409,
        'CATEGORY_ALREADY_EXISTS',
        `Category "${name}" already exists`,
      );
    }
    const codeExists = await this.categoryRepository.findByCode(code);
    if (codeExists) {
      throw new HttpError(
        409,
        'CATEGORY_CODE_ALREADY_EXISTS',
        `Category code "${code}" already exists`,
      );
    }

    return this.categoryRepository.create(null, {
      name,
      code,
      status,
      color,
      description,
    });
  };

  updateCategory = async (req, id, body) => {
    const name = body?.name?.trim();
    const code = body?.code?.trim();
    const status = (body?.status || 'ACTIVE').toUpperCase();
    const color = body?.color?.trim() || null;
    const description = body?.description?.trim() || null;
    if (!name) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'name is required');
    }
    if (!code) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'code is required');
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
    const codeExists = await this.categoryRepository.findByCode(code);
    if (codeExists && codeExists.id !== id) {
      throw new HttpError(
        409,
        'CATEGORY_CODE_ALREADY_EXISTS',
        `Category code "${code}" already exists`,
      );
    }

    const updated = await this.categoryRepository.update(req, id, {
      name,
      code,
      status,
      color,
      description,
    });
    if (!updated) {
      throw new HttpError(404, 'NOT_FOUND', 'Category not found');
    }
    return updated;
  };

  deleteCategory = async (req, id) => {
    const deleted = await this.categoryRepository.delete(req, id);
    if (!deleted) {
      throw new HttpError(404, 'NOT_FOUND', 'Category not found');
    }
    return { message: 'Category deleted successfully' };
  };
}
