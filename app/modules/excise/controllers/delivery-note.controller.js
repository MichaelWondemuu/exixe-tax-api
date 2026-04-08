import { formatResponse } from '../../../shared/utils/response-formatter.js';

export class DeliveryNoteController {
  constructor({ deliveryNoteQueryService, deliveryNoteCommandService }) {
    this.deliveryNoteQueryService = deliveryNoteQueryService;
    this.deliveryNoteCommandService = deliveryNoteCommandService;
  }

  list = async (req, res, next) => {
    try {
      const result = await this.deliveryNoteQueryService.list(req, req.query);
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };

  getById = async (req, res, next) => {
    try {
      const result = await this.deliveryNoteQueryService.getById(req, req.params.id);
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };

  create = async (req, res, next) => {
    try {
      const result = await this.deliveryNoteCommandService.create(req, req.body || {});
      res.status(201).json(formatResponse(result, 201));
    } catch (error) {
      next(error);
    }
  };

  updateStatus = async (req, res, next) => {
    try {
      const result = await this.deliveryNoteCommandService.updateStatus(
        req,
        req.params.id,
        req.body || {},
      );
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };
}

