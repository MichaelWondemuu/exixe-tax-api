import { formatResponse } from '../../../shared/utils/response-formatter.js';

export class ForecastController {
  constructor({ forecastQueryService, forecastCommandService }) {
    this.forecastQueryService = forecastQueryService;
    this.forecastCommandService = forecastCommandService;
  }

  list = async (req, res, next) => {
    try {
      const result = await this.forecastQueryService.list(req, req.query);
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };

  getById = async (req, res, next) => {
    try {
      const result = await this.forecastQueryService.getById(req, req.params.id);
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };

  create = async (req, res, next) => {
    try {
      const result = await this.forecastCommandService.create(req, req.body || {});
      res.status(201).json(formatResponse(result, 201));
    } catch (error) {
      next(error);
    }
  };

  update = async (req, res, next) => {
    try {
      const result = await this.forecastCommandService.update(
        req,
        req.params.id,
        req.body || {},
      );
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };

  submit = async (req, res, next) => {
    try {
      const result = await this.forecastCommandService.submit(req, req.params.id);
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };
}

