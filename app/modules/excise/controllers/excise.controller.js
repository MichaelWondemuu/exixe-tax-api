import { formatResponse } from '../../../shared/utils/response-formatter.js';

export class ExciseController {
  constructor({ exciseCommandService, exciseQueryService }) {
    this.exciseCommandService = exciseCommandService;
    this.exciseQueryService = exciseQueryService;
  }

  listFacilities = async (req, res, next) => {
    try {
      const result = await this.exciseQueryService.listFacilities(req, req.query);
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };

  getFacilityById = async (req, res, next) => {
    try {
      const result = await this.exciseQueryService.getFacilityById(req, req.params.id);
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };

  createFacility = async (req, res, next) => {
    try {
      const result = await this.exciseCommandService.createFacility(req, req.body || {});
      res.status(201).json(formatResponse(result, 201));
    } catch (error) {
      next(error);
    }
  };

  updateFacility = async (req, res, next) => {
    try {
      const result = await this.exciseCommandService.updateFacility(
        req,
        req.params.id,
        req.body || {},
      );
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };

  listDeliveryNotes = async (req, res, next) => {
    try {
      const result = await this.exciseQueryService.listDeliveryNotes(req, req.query);
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };

  getDeliveryNoteById = async (req, res, next) => {
    try {
      const result = await this.exciseQueryService.getDeliveryNoteById(
        req,
        req.params.id,
      );
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };

  createDeliveryNote = async (req, res, next) => {
    try {
      const result = await this.exciseCommandService.createDeliveryNote(
        req,
        req.body || {},
      );
      res.status(201).json(formatResponse(result, 201));
    } catch (error) {
      next(error);
    }
  };

  updateDeliveryNoteStatus = async (req, res, next) => {
    try {
      const result = await this.exciseCommandService.updateDeliveryNoteStatus(
        req,
        req.params.id,
        req.body || {},
      );
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };

  listStampRequests = async (req, res, next) => {
    try {
      const result = await this.exciseQueryService.listStampRequests(req, req.query);
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };

  getStampRequestById = async (req, res, next) => {
    try {
      const result = await this.exciseQueryService.getStampRequestById(
        req,
        req.params.id,
      );
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };

  createStampRequest = async (req, res, next) => {
    try {
      const result = await this.exciseCommandService.createStampRequest(
        req,
        req.body || {},
      );
      res.status(201).json(formatResponse(result, 201));
    } catch (error) {
      next(error);
    }
  };

  updateStampRequestPayment = async (req, res, next) => {
    try {
      const result = await this.exciseCommandService.updateStampRequestPayment(
        req,
        req.params.id,
        req.body || {},
      );
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };

  submitStampRequest = async (req, res, next) => {
    try {
      const result = await this.exciseCommandService.submitStampRequest(
        req,
        req.params.id,
      );
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };

  reviewStampRequest = async (req, res, next) => {
    try {
      const result = await this.exciseCommandService.reviewStampRequest(
        req,
        req.params.id,
        req.body || {},
      );
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };

  fulfillStampRequest = async (req, res, next) => {
    try {
      const result = await this.exciseCommandService.fulfillStampRequest(
        req,
        req.params.id,
      );
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };

  listStampRequestSlaBreaches = async (req, res, next) => {
    try {
      const result = await this.exciseQueryService.listStampRequestSlaBreaches(
        req,
        req.query,
      );
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };

  listForecasts = async (req, res, next) => {
    try {
      const result = await this.exciseQueryService.listForecasts(req, req.query);
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };

  getForecastById = async (req, res, next) => {
    try {
      const result = await this.exciseQueryService.getForecastById(req, req.params.id);
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };

  createForecast = async (req, res, next) => {
    try {
      const result = await this.exciseCommandService.createForecast(req, req.body || {});
      res.status(201).json(formatResponse(result, 201));
    } catch (error) {
      next(error);
    }
  };

  updateForecast = async (req, res, next) => {
    try {
      const result = await this.exciseCommandService.updateForecast(
        req,
        req.params.id,
        req.body || {},
      );
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };

  submitForecast = async (req, res, next) => {
    try {
      const result = await this.exciseCommandService.submitForecast(
        req,
        req.params.id,
      );
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };

  listStockEvents = async (req, res, next) => {
    try {
      const result = await this.exciseQueryService.listStockEvents(req, req.query);
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };

  getStockEventById = async (req, res, next) => {
    try {
      const result = await this.exciseQueryService.getStockEventById(req, req.params.id);
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };

  createStockEvent = async (req, res, next) => {
    try {
      const result = await this.exciseCommandService.createStockEvent(req, req.body || {});
      res.status(201).json(formatResponse(result, 201));
    } catch (error) {
      next(error);
    }
  };

  submitStockEvent = async (req, res, next) => {
    try {
      const result = await this.exciseCommandService.submitStockEvent(
        req,
        req.params.id,
      );
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };

  reviewStockEvent = async (req, res, next) => {
    try {
      const result = await this.exciseCommandService.reviewStockEvent(
        req,
        req.params.id,
        req.body || {},
      );
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };

  completeStockEvent = async (req, res, next) => {
    try {
      const result = await this.exciseCommandService.completeStockEvent(
        req,
        req.params.id,
      );
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };

  createPublicStampVerification = async (req, res, next) => {
    try {
      const result = await this.exciseCommandService.createStampVerification(
        req,
        req.body || {},
        { isPublic: true },
      );
      res.status(201).json(formatResponse(result, 201));
    } catch (error) {
      next(error);
    }
  };

  createStampVerification = async (req, res, next) => {
    try {
      const result = await this.exciseCommandService.createStampVerification(
        req,
        req.body || {},
        { isPublic: false },
      );
      res.status(201).json(formatResponse(result, 201));
    } catch (error) {
      next(error);
    }
  };

  listStampVerifications = async (req, res, next) => {
    try {
      const result = await this.exciseQueryService.listStampVerifications(
        req,
        req.query,
      );
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };

  getStampVerificationById = async (req, res, next) => {
    try {
      const result = await this.exciseQueryService.getStampVerificationById(
        req,
        req.params.id,
      );
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };

  getStampVerificationSummary = async (req, res, next) => {
    try {
      const result = await this.exciseQueryService.getStampVerificationSummary(req);
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };
}
