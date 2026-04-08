import { HttpError } from '../../../../shared/utils/http-error.js';

export class PredeclarationQueryService {
  /**
   * @param {{
   *   predeclarationRepository: import('../../repository/predeclaration.repository.js').PredeclarationRepository;
   * }} deps
   */
  constructor({ predeclarationRepository }) {
    this.predeclarationRepository = predeclarationRepository;
  }

  listPredeclarations = async (req, queryParams = {}) =>
    this.predeclarationRepository.findAllDetailed(req, queryParams);

  getPredeclarationById = async (req, id) => {
    const row = await this.predeclarationRepository.findByIdDetailed(req, id);
    if (!row) {
      throw new HttpError(404, 'NOT_FOUND', 'Predeclaration not found');
    }
    return row;
  };
}
