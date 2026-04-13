import { formatResponse } from '../../../shared/utils/response-formatter.js';
import { HttpError } from '../../../shared/utils/http-error.js';

export class ReconciliationController {
  constructor({ reconciliationCommandService, reconciliationQueryService }) {
    this.reconciliationCommandService = reconciliationCommandService;
    this.reconciliationQueryService = reconciliationQueryService;
  }

  createRun = async (req, res, next) => {
    try {
      const result = await this.reconciliationCommandService.createRun(
        req,
        req.body || {},
      );
      res.status(201).json(formatResponse(result, 201));
    } catch (error) {
      next(error);
    }
  };

  listRuns = async (req, res, next) => {
    try {
      const result = await this.reconciliationQueryService.listRuns(req, req.query);
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };

  getRunById = async (req, res, next) => {
    try {
      const result = await this.reconciliationQueryService.getRunById(
        req,
        req.params.id,
      );
      if (!result) {
        return next(
          new HttpError(404, 'NOT_FOUND', 'Reconciliation run not found'),
        );
      }
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };

  listRunItems = async (req, res, next) => {
    try {
      const result = await this.reconciliationQueryService.listRunItems(
        req,
        req.params.id,
        req.query,
      );
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };
}
