import { formatResponse } from '../../../shared/utils/response-formatter.js';

export class ExciseConfigController {
  constructor({ exciseConfigQueryService, exciseConfigCommandService }) {
    this.exciseConfigQueryService = exciseConfigQueryService;
    this.exciseConfigCommandService = exciseConfigCommandService;
  }

  list = async (req, res, next) => {
    try {
      const result = await this.exciseConfigQueryService.list(req, req.query);
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };

  getByKey = async (req, res, next) => {
    try {
      const result = await this.exciseConfigQueryService.getByKey(req, req.params.key);
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };

  create = async (req, res, next) => {
    try {
      const result = await this.exciseConfigCommandService.create(req, req.body || {});
      res.status(201).json(formatResponse(result, 201));
    } catch (error) {
      next(error);
    }
  };

  update = async (req, res, next) => {
    try {
      const result = await this.exciseConfigCommandService.update(
        req,
        req.params.key,
        req.body || {},
      );
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };

  delete = async (req, res, next) => {
    try {
      const result = await this.exciseConfigCommandService.delete(req, req.params.key);
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };
}
