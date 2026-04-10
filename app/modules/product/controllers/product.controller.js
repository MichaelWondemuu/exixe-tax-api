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

  listAllVariants = async (req, res, next) => {
    try {
      const result = await this.productQueryService.listAllVariants();
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };

  listOrganizationProducts = async (req, res, next) => {
    try {
      const result = await this.productQueryService.listOrganizationProducts(
        req,
        req.query,
      );
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

  listVariants = async (req, res, next) => {
    try {
      const result = await this.productQueryService.listVariants(
        req,
        req.params.id,
      );
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };

  getVariantById = async (req, res, next) => {
    try {
      const result = await this.productQueryService.getVariantById(
        req,
        req.params.id,
        req.params.variantId,
      );
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };

  createVariant = async (req, res, next) => {
    try {
      const result = await this.productCommandService.createVariant(
        req,
        req.params.id,
        req.body || {},
      );
      res.status(201).json(formatResponse(result, 201));
    } catch (error) {
      next(error);
    }
  };

  updateVariant = async (req, res, next) => {
    try {
      const result = await this.productCommandService.updateVariant(
        req,
        req.params.id,
        req.params.variantId,
        req.body || {},
      );
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };

  deleteVariant = async (req, res, next) => {
    try {
      const result = await this.productCommandService.deleteVariant(
        req,
        req.params.id,
        req.params.variantId,
      );
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };

  listVariantAttributes = async (req, res, next) => {
    try {
      const result = await this.productQueryService.listVariantAttributes(
        req,
        req.params.id,
        req.params.variantId,
      );
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };

  getVariantAttributeById = async (req, res, next) => {
    try {
      const result = await this.productQueryService.getVariantAttributeById(
        req,
        req.params.id,
        req.params.variantId,
        req.params.attributeId,
      );
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };

  createVariantAttribute = async (req, res, next) => {
    try {
      const result = await this.productCommandService.createVariantAttribute(
        req,
        req.params.id,
        req.params.variantId,
        req.body || {},
      );
      res.status(201).json(formatResponse(result, 201));
    } catch (error) {
      next(error);
    }
  };

  updateVariantAttribute = async (req, res, next) => {
    try {
      const result = await this.productCommandService.updateVariantAttribute(
        req,
        req.params.id,
        req.params.variantId,
        req.params.attributeId,
        req.body || {},
      );
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };

  deleteVariantAttribute = async (req, res, next) => {
    try {
      const result = await this.productCommandService.deleteVariantAttribute(
        req,
        req.params.id,
        req.params.variantId,
        req.params.attributeId,
      );
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };

  upsertOrganizationProductOverride = async (req, res, next) => {
    try {
      const result =
        await this.productCommandService.upsertOrganizationProductOverride(
          req,
          req.params.productId,
          req.body || {},
        );
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };

  listOrganizationProductVariants = async (req, res, next) => {
    try {
      const result = await this.productQueryService.listOrganizationProductVariants(
        req,
        req.params.orgProductId,
      );
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };

  createOrganizationCustomProduct = async (req, res, next) => {
    try {
      const result = await this.productCommandService.createOrganizationCustomProduct(
        req,
        req.body || {},
        req.file,
      );
      res.status(201).json(formatResponse(result, 201));
    } catch (error) {
      next(error);
    }
  };

  updateOrganizationProduct = async (req, res, next) => {
    try {
      const result = await this.productCommandService.updateOrganizationProduct(
        req,
        req.params.orgProductId,
        req.body || {},
        req.file,
      );
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };

  deleteOrganizationProduct = async (req, res, next) => {
    try {
      const result = await this.productCommandService.deleteOrganizationProduct(
        req,
        req.params.orgProductId,
      );
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };

  createOrganizationProductVariant = async (req, res, next) => {
    try {
      const result = await this.productCommandService.createOrganizationProductVariant(
        req,
        req.params.orgProductId,
        req.body || {},
      );
      res.status(201).json(formatResponse(result, 201));
    } catch (error) {
      next(error);
    }
  };

  updateOrganizationProductVariant = async (req, res, next) => {
    try {
      const result = await this.productCommandService.updateOrganizationProductVariant(
        req,
        req.params.orgProductVariantId,
        req.body || {},
      );
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };

  deleteOrganizationProductVariant = async (req, res, next) => {
    try {
      const result = await this.productCommandService.deleteOrganizationProductVariant(
        req,
        req.params.orgProductVariantId,
      );
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };

  createOrganizationProductVariantAttribute = async (req, res, next) => {
    try {
      const result =
        await this.productCommandService.createOrganizationProductVariantAttribute(
          req,
          req.params.orgProductVariantId,
          req.body || {},
        );
      res.status(201).json(formatResponse(result, 201));
    } catch (error) {
      next(error);
    }
  };

  bulkUpdateOrganizationProductVariantAttributes = async (req, res, next) => {
    try {
      const result =
        await this.productCommandService.bulkUpdateOrganizationProductVariantAttributes(
          req,
          req.params.orgProductVariantId,
          req.body || {},
        );
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };

  updateOrganizationProductVariantAttribute = async (req, res, next) => {
    try {
      const result =
        await this.productCommandService.updateOrganizationProductVariantAttribute(
          req,
          req.params.orgProductVariantAttributeId,
          req.body || {},
        );
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };

  deleteOrganizationProductVariantAttribute = async (req, res, next) => {
    try {
      const result =
        await this.productCommandService.deleteOrganizationProductVariantAttribute(
          req,
          req.params.orgProductVariantAttributeId,
        );
      res.json(formatResponse(result));
    } catch (error) {
      next(error);
    }
  };

}
