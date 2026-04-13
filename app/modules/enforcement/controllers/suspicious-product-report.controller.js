import { formatResponse } from '../../../shared/utils/response-formatter.js';
import { HttpError } from '../../../shared/utils/http-error.js';

export class SuspiciousProductReportController {
  constructor({
    suspiciousProductReportCommandService,
    suspiciousProductReportQueryService,
  }) {
    this.suspiciousProductReportCommandService =
      suspiciousProductReportCommandService;
    this.suspiciousProductReportQueryService =
      suspiciousProductReportQueryService;
  }

  createReport = async (req, res, next) => {
    try {
      const result = await this.suspiciousProductReportCommandService.create(
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
      const result = await this.suspiciousProductReportQueryService.list(
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
      const result = await this.suspiciousProductReportQueryService.getById(
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
      const result =
        await this.suspiciousProductReportCommandService.updateStatus(
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
}
