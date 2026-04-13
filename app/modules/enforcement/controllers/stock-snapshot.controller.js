import { formatResponse } from '../../../shared/utils/response-formatter.js';
import { HttpError } from '../../../shared/utils/http-error.js';

export class StockSnapshotController {
  constructor({ stockSnapshotCommandService, stockSnapshotQueryService }) {
    this.stockSnapshotCommandService = stockSnapshotCommandService;
    this.stockSnapshotQueryService = stockSnapshotQueryService;
  }

  createSnapshot = async (req, res, next) => {
    try {
      const result = await this.stockSnapshotCommandService.create(
        req,
        req.body || {},
      );
      res.status(201).json(formatResponse(result, 201));
    } catch (error) {
      next(error);
    }
  };

  listSnapshots = async (req, res, next) => {
    try {
      const result = await this.stockSnapshotQueryService.list(req, req.query);
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };

  getSnapshotById = async (req, res, next) => {
    try {
      const result = await this.stockSnapshotQueryService.getById(
        req,
        req.params.id,
      );
      if (!result) {
        return next(new HttpError(404, 'NOT_FOUND', 'Stock snapshot not found'));
      }
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };

  patchSnapshot = async (req, res, next) => {
    try {
      const result = await this.stockSnapshotCommandService.patch(
        req,
        req.params.id,
        req.body || {},
      );
      if (!result) {
        return next(new HttpError(404, 'NOT_FOUND', 'Stock snapshot not found'));
      }
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };
}
