import { formatResponse } from '../../../shared/utils/response-formatter.js';

export class FacilityController {
  constructor({ facilityQueryService, facilityCommandService }) {
    this.facilityQueryService = facilityQueryService;
    this.facilityCommandService = facilityCommandService;
  }

  list = async (req, res, next) => {
    try {
      const result = await this.facilityQueryService.list(req, req.query);
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };

  getById = async (req, res, next) => {
    try {
      const result = await this.facilityQueryService.getById(req, req.params.id);
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };

  create = async (req, res, next) => {
    try {
      const result = await this.facilityCommandService.create(req, req.body || {});
      res.status(201).json(formatResponse(result, 201));
    } catch (error) {
      next(error);
    }
  };

  update = async (req, res, next) => {
    try {
      const result = await this.facilityCommandService.update(
        req,
        req.params.id,
        req.body || {},
      );
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };
}

