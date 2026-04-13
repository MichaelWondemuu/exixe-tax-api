import { formatResponse } from '../../../shared/utils/response-formatter.js';
import { HttpError } from '../../../shared/utils/http-error.js';

export class ProductionRecordController {
  constructor({ productionRecordCommandService, productionRecordQueryService }) {
    this.productionRecordCommandService = productionRecordCommandService;
    this.productionRecordQueryService = productionRecordQueryService;
  }

  createRecord = async (req, res, next) => {
    try {
      const result = await this.productionRecordCommandService.create(
        req,
        req.body || {},
      );
      res.status(201).json(formatResponse(result, 201));
    } catch (error) {
      next(error);
    }
  };

  listRecords = async (req, res, next) => {
    try {
      const result = await this.productionRecordQueryService.list(req, req.query);
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };

  getRecordById = async (req, res, next) => {
    try {
      const result = await this.productionRecordQueryService.getById(
        req,
        req.params.id,
      );
      if (!result) {
        return next(
          new HttpError(404, 'NOT_FOUND', 'Production record not found'),
        );
      }
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };

  patchRecord = async (req, res, next) => {
    try {
      const result = await this.productionRecordCommandService.patch(
        req,
        req.params.id,
        req.body || {},
      );
      if (!result) {
        return next(
          new HttpError(404, 'NOT_FOUND', 'Production record not found'),
        );
      }
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };
}
