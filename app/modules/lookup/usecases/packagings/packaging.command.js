import { HttpError } from '../../../../shared/utils/http-error.js';

export class PackagingCommandService {
  /**
   * @param {{
   *   packagingRepository: import('../../repository/packaging.repository.js').PackagingRepository;
   * }} deps
   */
  constructor({ packagingRepository }) {
    this.packagingRepository = packagingRepository;
  }

  createPackaging = async (body) => {
    const name = body?.name?.trim();
    if (!name) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'name is required');
    }

    const exists = await this.packagingRepository.findByName(name);
    if (exists) {
      throw new HttpError(
        409,
        'PACKAGING_ALREADY_EXISTS',
        `Packaging "${name}" already exists`,
      );
    }

    return this.packagingRepository.create(null, { name });
  };

  updatePackaging = async (req, id, body) => {
    const name = body?.name?.trim();
    if (!name) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'name is required');
    }

    const current = await this.packagingRepository.findByPkListed(id);
    if (!current) {
      throw new HttpError(404, 'NOT_FOUND', 'Packaging not found');
    }

    const exists = await this.packagingRepository.findByName(name);
    if (exists && exists.id !== id) {
      throw new HttpError(
        409,
        'PACKAGING_ALREADY_EXISTS',
        `Packaging "${name}" already exists`,
      );
    }

    const updated = await this.packagingRepository.update(req, id, { name });
    if (!updated) {
      throw new HttpError(404, 'NOT_FOUND', 'Packaging not found');
    }
    return updated;
  };

  deletePackaging = async (req, id) => {
    const deleted = await this.packagingRepository.delete(req, id);
    if (!deleted) {
      throw new HttpError(404, 'NOT_FOUND', 'Packaging not found');
    }
    return { message: 'Packaging deleted successfully' };
  };
}
