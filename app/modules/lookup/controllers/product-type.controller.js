import { formatResponse } from '../../../shared/utils/response-formatter.js';

export class ProductTypeController {
  constructor({ productTypeQueryService, productTypeCommandService }) {
    this.productTypeQueryService = productTypeQueryService;
    this.productTypeCommandService = productTypeCommandService;
  }

  listProductTypes = async (req, res, next) => {
    try {
      const result = await this.productTypeQueryService.listProductTypes();
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };

  getProductTypeById = async (req, res, next) => {
    try {
      const result = await this.productTypeQueryService.getProductTypeById(
        req.params.id,
      );
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };

  createProductType = async (req, res, next) => {
    try {
      const result = await this.productTypeCommandService.createProductType(
        req.body || {},
      );
      res.status(201).json(formatResponse(result, 201));
    } catch (error) {
      next(error);
    }
  };

  updateProductType = async (req, res, next) => {
    try {
      const result = await this.productTypeCommandService.updateProductType(
        req,
        req.params.id,
        req.body || {},
      );
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };

  deleteProductType = async (req, res, next) => {
    try {
      const result = await this.productTypeCommandService.deleteProductType(
        req,
        req.params.id,
      );
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };
}
