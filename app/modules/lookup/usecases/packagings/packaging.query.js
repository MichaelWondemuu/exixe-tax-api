import { HttpError } from '../../../../shared/utils/http-error.js';

export class PackagingQueryService {
  /**
   * @param {{
   *   packagingRepository: import('../../repository/packaging.repository.js').PackagingRepository;
   * }} deps
   */
  constructor({ packagingRepository }) {
    this.packagingRepository = packagingRepository;
  }

  listPackagings = async () => this.packagingRepository.findAllListed();

  getPackagingById = async (id) => {
    const row = await this.packagingRepository.findByPkListed(id);
    if (!row) {
      throw new HttpError(404, 'NOT_FOUND', 'Packaging not found');
    }
    return row;
  };
}
