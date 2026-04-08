import { formatResponse } from '../../../shared/utils/response-formatter.js';

export class PredeclarationController {
  constructor({ predeclarationQueryService, predeclarationCommandService }) {
    this.predeclarationQueryService = predeclarationQueryService;
    this.predeclarationCommandService = predeclarationCommandService;
  }

  listPredeclarations = async (req, res, next) => {
    try {
      const result = await this.predeclarationQueryService.listPredeclarations(
        req,
        req.query,
      );
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };

  getPredeclarationById = async (req, res, next) => {
    try {
      const result = await this.predeclarationQueryService.getPredeclarationById(
        req,
        req.params.id,
      );
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };

  createPredeclaration = async (req, res, next) => {
    try {
      const result = await this.predeclarationCommandService.createPredeclaration(
        req,
        req.body || {},
      );
      res.status(201).json(formatResponse(result, 201));
    } catch (error) {
      next(error);
    }
  };

  updatePredeclaration = async (req, res, next) => {
    try {
      const result = await this.predeclarationCommandService.updatePredeclaration(
        req,
        req.params.id,
        req.body || {},
      );
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };

  deletePredeclaration = async (req, res, next) => {
    try {
      const result = await this.predeclarationCommandService.deletePredeclaration(
        req,
        req.params.id,
      );
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };

  submitPredeclaration = async (req, res, next) => {
    try {
      const result = await this.predeclarationCommandService.submitPredeclaration(
        req,
        req.params.id,
      );
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };

  approvePredeclaration = async (req, res, next) => {
    try {
      const result = await this.predeclarationCommandService.approvePredeclaration(
        req,
        req.params.id,
      );
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };

  rejectPredeclaration = async (req, res, next) => {
    try {
      const result = await this.predeclarationCommandService.rejectPredeclaration(
        req,
        req.params.id,
        req.body || {},
      );
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };

  cancelPredeclaration = async (req, res, next) => {
    try {
      const result = await this.predeclarationCommandService.cancelPredeclaration(
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
