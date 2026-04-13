import { formatResponse } from '../../../shared/utils/response-formatter.js';

export class StampLabelTemplateController {
  constructor({ stampLabelTemplateQueryService, stampLabelTemplateCommandService }) {
    this.stampLabelTemplateQueryService = stampLabelTemplateQueryService;
    this.stampLabelTemplateCommandService = stampLabelTemplateCommandService;
  }

  list = async (req, res, next) => {
    try {
      const result = await this.stampLabelTemplateQueryService.list(req, req.query);
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };

  getById = async (req, res, next) => {
    try {
      const result = await this.stampLabelTemplateQueryService.getById(req, req.params.id);
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };

  resolveByStampRequestId = async (req, res, next) => {
    try {
      const result = await this.stampLabelTemplateQueryService.resolveByStampRequestId(
        req,
        req.params.stampRequestId,
      );
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };

  create = async (req, res, next) => {
    try {
      const result = await this.stampLabelTemplateCommandService.create(req, req.body || {});
      res.status(201).json(formatResponse(result, 201));
    } catch (error) {
      next(error);
    }
  };

  update = async (req, res, next) => {
    try {
      const result = await this.stampLabelTemplateCommandService.update(
        req,
        req.params.id,
        req.body || {},
      );
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };

  delete = async (req, res, next) => {
    try {
      const result = await this.stampLabelTemplateCommandService.delete(req, req.params.id);
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };
}
