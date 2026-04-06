import { HttpError } from '../../../../shared/utils/http-error.js';

export class MeasurementQueryService {
  /**
   * @param {{
   *   measurementRepository: import('../../repository/measurement.repository.js').MeasurementRepository;
   * }} deps
   */
  constructor({ measurementRepository }) {
    this.measurementRepository = measurementRepository;
  }

  listMeasurements = async () => this.measurementRepository.findAllListed();

  getMeasurementById = async (id) => {
    const row = await this.measurementRepository.findByPkListed(id);
    if (!row) {
      throw new HttpError(404, 'NOT_FOUND', 'Measurement not found');
    }
    return row;
  };
}
