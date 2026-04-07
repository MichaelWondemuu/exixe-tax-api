import { formatResponse } from '../../../shared/utils/response-formatter.js';

export class MeasurementController {
  constructor({ measurementQueryService, measurementCommandService }) {
    this.measurementQueryService = measurementQueryService;
    this.measurementCommandService = measurementCommandService;
  }

  listMeasurements = async (req, res, next) => {
    try {
      const result = await this.measurementQueryService.listMeasurements();
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };

  getMeasurementById = async (req, res, next) => {
    try {
      const result = await this.measurementQueryService.getMeasurementById(
        req.params.id,
      );
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };

  createMeasurement = async (req, res, next) => {
    try {
      const result = await this.measurementCommandService.createMeasurement(
        req.body || {},
      );
      res.status(201).json(formatResponse(result, 201));
    } catch (error) {
      next(error);
    }
  };

  updateMeasurement = async (req, res, next) => {
    try {
      const result = await this.measurementCommandService.updateMeasurement(
        req,
        req.params.id,
        req.body || {},
      );
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };

  deleteMeasurement = async (req, res, next) => {
    try {
      const result = await this.measurementCommandService.deleteMeasurement(
        req,
        req.params.id,
      );
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };
}
