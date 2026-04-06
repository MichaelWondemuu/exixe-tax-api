import { HttpError } from '../../../../shared/utils/http-error.js';

export class MeasurementCommandService {
  /**
   * @param {{
   *   measurementRepository: import('../../repository/measurement.repository.js').MeasurementRepository;
   * }} deps
   */
  constructor({ measurementRepository }) {
    this.measurementRepository = measurementRepository;
  }

  createMeasurement = async (body) => {
    const name = body?.name?.trim();
    const shortForm = body?.shortForm?.trim() || null;
    if (!name) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'name is required');
    }

    const exists = await this.measurementRepository.findByName(name);
    if (exists) {
      throw new HttpError(
        409,
        'MEASUREMENT_ALREADY_EXISTS',
        `Measurement "${name}" already exists`,
      );
    }

    if (shortForm) {
      const shortFormExists =
        await this.measurementRepository.findByShortForm(shortForm);
      if (shortFormExists) {
        throw new HttpError(
          409,
          'MEASUREMENT_SHORT_FORM_ALREADY_EXISTS',
          `Measurement short form "${shortForm}" already exists`,
        );
      }
    }

    return this.measurementRepository.create(null, { name, shortForm });
  };

  updateMeasurement = async (req, id, body) => {
    const name = body?.name?.trim();
    const shortForm = body?.shortForm?.trim() || null;
    if (!name) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'name is required');
    }

    const current = await this.measurementRepository.findByPkListed(id);
    if (!current) {
      throw new HttpError(404, 'NOT_FOUND', 'Measurement not found');
    }

    const exists = await this.measurementRepository.findByName(name);
    if (exists && exists.id !== id) {
      throw new HttpError(
        409,
        'MEASUREMENT_ALREADY_EXISTS',
        `Measurement "${name}" already exists`,
      );
    }

    if (shortForm) {
      const shortFormExists =
        await this.measurementRepository.findByShortForm(shortForm);
      if (shortFormExists && shortFormExists.id !== id) {
        throw new HttpError(
          409,
          'MEASUREMENT_SHORT_FORM_ALREADY_EXISTS',
          `Measurement short form "${shortForm}" already exists`,
        );
      }
    }

    const updated = await this.measurementRepository.update(req, id, {
      name,
      shortForm,
    });
    if (!updated) {
      throw new HttpError(404, 'NOT_FOUND', 'Measurement not found');
    }
    return updated;
  };

  deleteMeasurement = async (req, id) => {
    const deleted = await this.measurementRepository.delete(req, id);
    if (!deleted) {
      throw new HttpError(404, 'NOT_FOUND', 'Measurement not found');
    }
    return { message: 'Measurement deleted successfully' };
  };
}
