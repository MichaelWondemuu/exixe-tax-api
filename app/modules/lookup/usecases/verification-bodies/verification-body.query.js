import { HttpError } from '../../../../shared/utils/http-error.js';

export class VerificationBodyQueryService {
  /**
   * @param {{
   *   verificationBodyRepository: import('../../repository/verification-body.repository.js').VerificationBodyRepository;
   * }} deps
   */
  constructor({ verificationBodyRepository }) {
    this.verificationBodyRepository = verificationBodyRepository;
  }

  listVerificationBodies = async () => {
    const list = await this.verificationBodyRepository.findAllListed();
    return { data: list };
  };

  getVerificationBodyById = async (id) => {
    const row = await this.verificationBodyRepository.findByPkListed(id);
    if (!row) {
      throw new HttpError(404, 'NOT_FOUND', 'Verification body not found');
    }
    return { data: row };
  };
}
