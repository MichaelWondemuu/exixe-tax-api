import {
  DataResponseFormat,
  formatResponse,
} from '../../../shared/utils/response-formatter.js';
import { HttpError } from '../../../shared/utils/http-error.js';

export class ProductRecallController {
  constructor({ productRecallCommandService, productRecallQueryService }) {
    this.productRecallCommandService = productRecallCommandService;
    this.productRecallQueryService = productRecallQueryService;
  }

  createRecall = async (req, res, next) => {
    try {
      const result = await this.productRecallCommandService.create(
        req,
        req.body || {},
      );
      res.status(201).json(formatResponse(result, 201));
    } catch (error) {
      next(error);
    }
  };

  listRecallsAdmin = async (req, res, next) => {
    try {
      const result = await this.productRecallQueryService.listAdmin(
        req,
        req.query,
      );
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };

  getRecallByIdAdmin = async (req, res, next) => {
    try {
      const result = await this.productRecallQueryService.getByIdAdmin(
        req,
        req.params.id,
      );
      if (!result) {
        return next(new HttpError(404, 'NOT_FOUND', 'Recall not found'));
      }
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };

  patchRecall = async (req, res, next) => {
    try {
      const result = await this.productRecallCommandService.patch(
        req,
        req.params.id,
        req.body || {},
      );
      if (!result) {
        return next(new HttpError(404, 'NOT_FOUND', 'Recall not found'));
      }
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };

  publishRecall = async (req, res, next) => {
    try {
      const result = await this.productRecallCommandService.publish(
        req,
        req.params.id,
      );
      if (!result) {
        return next(new HttpError(404, 'NOT_FOUND', 'Recall not found'));
      }
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };

  suspendRecall = async (req, res, next) => {
    try {
      const result = await this.productRecallCommandService.suspend(
        req,
        req.params.id,
      );
      if (!result) {
        return next(new HttpError(404, 'NOT_FOUND', 'Recall not found'));
      }
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };

  closeRecall = async (req, res, next) => {
    try {
      const result = await this.productRecallCommandService.close(
        req,
        req.params.id,
      );
      if (!result) {
        return next(new HttpError(404, 'NOT_FOUND', 'Recall not found'));
      }
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };

  listActiveRecalls = async (req, res, next) => {
    try {
      const { data, count } =
        await this.productRecallQueryService.listActiveForProduct(req, {
          productId: req.query.productId,
          productVariantId: req.query.productVariantId ?? null,
          lotOrBatchCode: req.query.lotOrBatchCode ?? null,
        });
      res.json(
        formatResponse(DataResponseFormat.from(data, count)),
      );
    } catch (error) {
      next(error);
    }
  };
}
