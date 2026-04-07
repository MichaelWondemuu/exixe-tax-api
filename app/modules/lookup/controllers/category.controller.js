import { formatResponse } from '../../../shared/utils/response-formatter.js';

export class CategoryController {
  constructor({ categoryQueryService, categoryCommandService }) {
    this.categoryQueryService = categoryQueryService;
    this.categoryCommandService = categoryCommandService;
  }

  listCategories = async (req, res, next) => {
    try {
      const result = await this.categoryQueryService.listCategories();
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };

  getCategoryById = async (req, res, next) => {
    try {
      const result = await this.categoryQueryService.getCategoryById(
        req.params.id,
      );
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };

  createCategory = async (req, res, next) => {
    try {
      const result = await this.categoryCommandService.createCategory(
        req.body || {},
      );
      res.status(201).json(formatResponse(result, 201));
    } catch (error) {
      next(error);
    }
  };

  updateCategory = async (req, res, next) => {
    try {
      const result = await this.categoryCommandService.updateCategory(
        req,
        req.params.id,
        req.body || {},
      );
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };

  deleteCategory = async (req, res, next) => {
    try {
      const result = await this.categoryCommandService.deleteCategory(
        req,
        req.params.id,
      );
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };
}
