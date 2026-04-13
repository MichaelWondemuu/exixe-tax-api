import { formatResponse } from '../../../shared/utils/response-formatter.js';

export class StampLabelController {
  constructor({ stampLabelQueryService, stampLabelCommandService }) {
    this.stampLabelQueryService = stampLabelQueryService;
    this.stampLabelCommandService = stampLabelCommandService;
  }

  list = async (req, res, next) => {
    try {
      const result = await this.stampLabelQueryService.list(req, req.query);
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };

  getById = async (req, res, next) => {
    try {
      const result = await this.stampLabelQueryService.getById(req, req.params.id);
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };

  getByUid = async (req, res, next) => {
    try {
      const result = await this.stampLabelQueryService.getByUid(
        req,
        req.params.stampUid,
      );
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };

  getByBatchNumber = async (req, res, next) => {
    try {
      const result = await this.stampLabelQueryService.getByBatchNumber(
        req,
        req.params.batchNumber,
      );
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };

  getAuditTrail = async (req, res, next) => {
    try {
      const result = await this.stampLabelQueryService.getAuditTrail(req, req.params.id);
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };

  getBatchAuditTrail = async (req, res, next) => {
    try {
      const result = await this.stampLabelQueryService.getBatchAuditTrail(
        req,
        req.params.batchNumber,
      );
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };

  getSummary = async (req, res, next) => {
    try {
      const result = await this.stampLabelQueryService.getSummary(req);
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };

  generate = async (req, res, next) => {
    try {
      const result = await this.stampLabelCommandService.generate(req, req.body || {});
      res.status(201).json(formatResponse(result, 201));
    } catch (error) {
      next(error);
    }
  };

  issue = async (req, res, next) => {
    try {
      const result = await this.stampLabelCommandService.issue(
        req,
        req.params.id,
        req.body || {},
      );
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };

  issueByBatch = async (req, res, next) => {
    try {
      const result = await this.stampLabelCommandService.issueByBatch(
        req,
        req.params.batchNumber,
        req.body || {},
      );
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };

  assign = async (req, res, next) => {
    try {
      const result = await this.stampLabelCommandService.assign(
        req,
        req.params.id,
        req.body || {},
      );
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };

  apply = async (req, res, next) => {
    try {
      const result = await this.stampLabelCommandService.apply(
        req,
        req.params.id,
        req.body || {},
      );
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };

  activate = async (req, res, next) => {
    try {
      const result = await this.stampLabelCommandService.activate(
        req,
        req.params.id,
        req.body || {},
      );
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };

  track = async (req, res, next) => {
    try {
      const result = await this.stampLabelCommandService.track(
        req,
        req.params.id,
        req.body || {},
      );
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };

  verify = async (req, res, next) => {
    try {
      const result = await this.stampLabelCommandService.verify(
        req,
        req.params.id,
        req.body || {},
      );
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };

  verifyPublic = async (req, res, next) => {
    try {
      const result = await this.stampLabelCommandService.verifyByUid(req, req.body || {});
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };

  audit = async (req, res, next) => {
    try {
      const result = await this.stampLabelCommandService.audit(
        req,
        req.params.id,
        req.body || {},
      );
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };

  auditByBatch = async (req, res, next) => {
    try {
      const result = await this.stampLabelCommandService.auditByBatch(
        req,
        req.params.batchNumber,
        req.body || {},
      );
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };

  enforce = async (req, res, next) => {
    try {
      const result = await this.stampLabelCommandService.enforce(
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
