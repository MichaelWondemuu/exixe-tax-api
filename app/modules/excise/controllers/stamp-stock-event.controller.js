import { formatResponse } from '../../../shared/utils/response-formatter.js';

export class StampStockEventController {
  constructor({ stampStockEventQueryService, stampStockEventCommandService }) {
    this.stampStockEventQueryService = stampStockEventQueryService;
    this.stampStockEventCommandService = stampStockEventCommandService;
  }

  list = async (req, res, next) => {
    try {
      const result = await this.stampStockEventQueryService.list(req, req.query);
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };

  getById = async (req, res, next) => {
    try {
      const result = await this.stampStockEventQueryService.getById(req, req.params.id);
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };

  create = async (req, res, next) => {
    try {
      const result = await this.stampStockEventCommandService.create(req, req.body || {});
      res.status(201).json(formatResponse(result, 201));
    } catch (error) {
      next(error);
    }
  };

  submit = async (req, res, next) => {
    try {
      const result = await this.stampStockEventCommandService.submit(req, req.params.id);
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };

  review = async (req, res, next) => {
    try {
      const result = await this.stampStockEventCommandService.review(
        req,
        req.params.id,
        req.body || {},
      );
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };

  complete = async (req, res, next) => {
    try {
      const result = await this.stampStockEventCommandService.complete(req, req.params.id);
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };
}

