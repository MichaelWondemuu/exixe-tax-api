import { HttpError } from '../../../../shared/utils/http-error.js';

export class LicensingAuthorityQueryService {
  /**
   * @param {{
   *   licensingAuthorityRepository: import('../../repository/licensing-authority.repository.js').LicensingAuthorityRepository;
   * }} deps
   */
  constructor({ licensingAuthorityRepository }) {
    this.licensingAuthorityRepository = licensingAuthorityRepository;
  }

  listLicensingAuthorities = async () => {
    const list = await this.licensingAuthorityRepository.findAllListed();
    return { data: list };
  };

  getLicensingAuthorityById = async (id) => {
    const row = await this.licensingAuthorityRepository.findByPkListed(id);
    if (!row) {
      throw new HttpError(404, 'NOT_FOUND', 'Licensing authority not found');
    }
    return { data: row };
  };
}
