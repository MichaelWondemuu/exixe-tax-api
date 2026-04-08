import { formatResponse } from '../../../shared/utils/response-formatter.js';

export class StampRequestController {
  constructor({ stampRequestQueryService, stampRequestCommandService }) {
    this.stampRequestQueryService = stampRequestQueryService;
    this.stampRequestCommandService = stampRequestCommandService;
  }

  list = async (req, res, next) => {
    try {
      const result = await this.stampRequestQueryService.list(req, req.query);
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };

  getById = async (req, res, next) => {
    try {
      const result = await this.stampRequestQueryService.getById(req, req.params.id);
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };

  create = async (req, res, next) => {
    try {
      const result = await this.stampRequestCommandService.create(req, req.body || {});
      res.status(201).json(formatResponse(result, 201));
    } catch (error) {
      next(error);
    }
  };

  updatePayment = async (req, res, next) => {
    try {
      const result = await this.stampRequestCommandService.updatePayment(
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
      const result = await this.stampRequestCommandService.submit(req, req.params.id);
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };

  fulfill = async (req, res, next) => {
    try {
      const result = await this.stampRequestCommandService.fulfill(req, req.params.id);
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };

  review = async (req, res, next) => {
    try {
      const result = await this.stampRequestCommandService.review(
        req,
        req.params.id,
        req.body || {},
      );
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };

  listSlaBreaches = async (req, res, next) => {
    try {
      const result = await this.stampRequestQueryService.listSlaBreaches(req, req.query);
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };
}

