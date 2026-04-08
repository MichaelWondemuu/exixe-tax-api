import { formatResponse } from '../../../shared/utils/response-formatter.js';

export class StampVerificationController {
  constructor({ stampVerificationQueryService, stampVerificationCommandService }) {
    this.stampVerificationQueryService = stampVerificationQueryService;
    this.stampVerificationCommandService = stampVerificationCommandService;
  }

  list = async (req, res, next) => {
    try {
      const result = await this.stampVerificationQueryService.list(req, req.query);
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };

  getById = async (req, res, next) => {
    try {
      const result = await this.stampVerificationQueryService.getById(req, req.params.id);
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };

  getSummary = async (req, res, next) => {
    try {
      const result = await this.stampVerificationQueryService.getSummary(req);
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };

  createPublic = async (req, res, next) => {
    try {
      const result = await this.stampVerificationCommandService.createPublic(
        req,
        req.body || {},
      );
      res.status(201).json(formatResponse(result, 201));
    } catch (error) {
      next(error);
    }
  };

  createOperator = async (req, res, next) => {
    try {
      const result = await this.stampVerificationCommandService.createOperator(
        req,
        req.body || {},
      );
      res.status(201).json(formatResponse(result, 201));
    } catch (error) {
      next(error);
    }
  };
}

