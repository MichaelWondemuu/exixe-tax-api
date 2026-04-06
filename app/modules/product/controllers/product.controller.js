import { formatResponse } from '../../../shared/utils/response-formatter.js';

export class ProductController {
  constructor({ productQueryService, productCommandService }) {
    this.productQueryService = productQueryService;
    this.productCommandService = productCommandService;
  }

  listProducts = async (req, res, next) => {
    try {
      const result = await this.productQueryService.listProducts(req, req.query);
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };

  getProductById = async (req, res, next) => {
    try {
      const result = await this.productQueryService.getProductById(
        req,
        req.params.id,
      );
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };

  createProduct = async (req, res, next) => {
    try {
      const result = await this.productCommandService.createProduct(
        req,
        req.body,
        req.file,
      );
      res.status(201).json(formatResponse(result, 201));
    } catch (error) {
      next(error);
    }
  };

  updateProduct = async (req, res, next) => {
    try {
      const result = await this.productCommandService.updateProduct(
        req,
        req.params.id,
        req.body,
        req.file,
      );
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };

  deleteProduct = async (req, res, next) => {
    try {
      const result = await this.productCommandService.deleteProduct(
        req,
        req.params.id,
      );
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };

}
