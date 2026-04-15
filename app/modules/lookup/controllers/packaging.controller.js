import { formatResponse } from '../../../shared/utils/response-formatter.js';

export class PackagingController {
  constructor({ packagingQueryService, packagingCommandService }) {
    this.packagingQueryService = packagingQueryService;
    this.packagingCommandService = packagingCommandService;
  }

  listPackagings = async (req, res, next) => {
    try {
      const result = await this.packagingQueryService.listPackagings();
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };

  getPackagingById = async (req, res, next) => {
    try {
      const result = await this.packagingQueryService.getPackagingById(
        req.params.id,
      );
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };

  createPackaging = async (req, res, next) => {
    try {
      const result = await this.packagingCommandService.createPackaging(
        req.body || {},
      );
      res.status(201).json(formatResponse(result, 201));
    } catch (error) {
      next(error);
    }
  };

  updatePackaging = async (req, res, next) => {
    try {
      const result = await this.packagingCommandService.updatePackaging(
        req,
        req.params.id,
        req.body || {},
      );
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };

  deletePackaging = async (req, res, next) => {
    try {
      const result = await this.packagingCommandService.deletePackaging(
        req,
        req.params.id,
      );
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };
}
