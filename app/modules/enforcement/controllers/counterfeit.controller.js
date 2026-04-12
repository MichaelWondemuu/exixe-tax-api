import { formatResponse } from '../../../shared/utils/response-formatter.js';
import { HttpError } from '../../../shared/utils/http-error.js';

export class CounterfeitController {
  constructor({
    counterfeitReportCommandService,
    counterfeitReportQueryService,
    counterfeitCaseCommandService,
    counterfeitCaseQueryService,
  }) {
    this.counterfeitReportCommandService = counterfeitReportCommandService;
    this.counterfeitReportQueryService = counterfeitReportQueryService;
    this.counterfeitCaseCommandService = counterfeitCaseCommandService;
    this.counterfeitCaseQueryService = counterfeitCaseQueryService;
  }

  createReport = async (req, res, next) => {
    try {
      const result = await this.counterfeitReportCommandService.create(
        req,
        req.body || {},
      );
      res.status(201).json(formatResponse(result, 201));
    } catch (error) {
      next(error);
    }
  };

  listReportsAdmin = async (req, res, next) => {
    try {
      const result = await this.counterfeitReportQueryService.list(
        req,
        req.query,
      );
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };

  getReportByIdAdmin = async (req, res, next) => {
    try {
      const result = await this.counterfeitReportQueryService.getById(
        req,
        req.params.id,
      );
      if (!result) {
        return next(new HttpError(404, 'NOT_FOUND', 'Report not found'));
      }
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };

  patchReportStatusAdmin = async (req, res, next) => {
    try {
      const result = await this.counterfeitReportCommandService.updateStatus(
        req,
        req.params.id,
        req.body,
      );
      if (!result) {
        return next(new HttpError(404, 'NOT_FOUND', 'Report not found'));
      }
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };

  createCase = async (req, res, next) => {
    try {
      const result = await this.counterfeitCaseCommandService.create(
        req,
        req.body || {},
      );
      res.status(201).json(formatResponse(result, 201));
    } catch (error) {
      next(error);
    }
  };

  listCases = async (req, res, next) => {
    try {
      const result = await this.counterfeitCaseQueryService.list(
        req,
        req.query,
      );
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };

  getCaseById = async (req, res, next) => {
    try {
      const result = await this.counterfeitCaseQueryService.getById(
        req,
        req.params.id,
      );
      if (!result) {
        return next(new HttpError(404, 'NOT_FOUND', 'Case not found'));
      }
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };

  patchCase = async (req, res, next) => {
    try {
      const result = await this.counterfeitCaseCommandService.patch(
        req,
        req.params.id,
        req.body || {},
      );
      if (!result) {
        return next(new HttpError(404, 'NOT_FOUND', 'Case not found'));
      }
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };
}
