import express from 'express';
import { authMiddleware } from '../../auth/middleware/index.js';
import {
  validateBody,
  validateParams,
  yup,
} from '../../../shared/middleware/validate.middleware.js';
import { createSingleImageUploadMiddleware } from '../../../shared/utils/file-upload.util.js';

const productBodySchema = yup.object({
  name: yup.string().trim().min(1).max(255).required(),
  description: yup.string().trim().max(2000).nullable(),
  categoryId: yup.string().uuid().required(),
  productTypeId: yup.string().uuid().required(),
  measurementId: yup.string().uuid().required(),
  isActive: yup.boolean().required(),
  variants: yup
    .mixed()
    .required()
    .test(
      'variants-array-or-json',
      'variants must be an array or JSON string array',
      (value) => {
        if (Array.isArray(value)) return true;
        if (typeof value === 'string') {
          try {
            return Array.isArray(JSON.parse(value));
          } catch {
            return false;
          }
        }
        return false;
      },
    ),
});

const productIdParamsSchema = yup.object({
  id: yup.string().uuid().required(),
});

const variantIdParamsSchema = yup.object({
  id: yup.string().uuid().required(),
  variantId: yup.string().uuid().required(),
});

const attributeIdParamsSchema = yup.object({
  id: yup.string().uuid().required(),
  variantId: yup.string().uuid().required(),
  attributeId: yup.string().uuid().required(),
});

const productRefParamsSchema = yup.object({
  productId: yup.string().uuid().required(),
});

const orgProductIdParamsSchema = yup.object({
  orgProductId: yup.string().uuid().required(),
});
const orgProductVariantIdParamsSchema = yup.object({
  orgProductVariantId: yup.string().uuid().required(),
});
const orgProductVariantAttributeIdParamsSchema = yup.object({
  orgProductVariantAttributeId: yup.string().uuid().required(),
});

const variantBodySchema = yup.object({
  name: yup.string().trim().min(1).max(255).required(),
  sku: yup.string().trim().max(100).required(),
  unitValue: yup.number().moreThan(0).required(),
  sellingPrice: yup.number().min(0).required(),
  isActive: yup.boolean().required(),
  attributes: yup.array().of(
    yup.object({
      key: yup.string().trim().min(1).max(100).required(),
      value: yup.string().trim().min(1).max(255).required(),
    }),
  ),
});

const variantAttributeBodySchema = yup.object({
  key: yup.string().trim().min(1).max(100).required(),
  value: yup.string().trim().min(1).max(255).required(),
});

const orgProductOverrideBodySchema = yup.object({
  name: yup.string().trim().max(255).nullable(),
  description: yup.string().trim().max(2000).nullable(),
  imageUrl: yup.string().trim().max(500).nullable(),
  isActive: yup.boolean(),
});

const orgCustomProductBodySchema = yup.object({
  name: yup.string().trim().min(1).max(255).required(),
  description: yup.string().trim().max(2000).nullable(),
  imageUrl: yup.string().trim().max(500).nullable(),
  isActive: yup.boolean(),
});

const orgProductVariantBodySchema = yup.object({
  productVariantId: yup.string().uuid().nullable(),
  name: yup.string().trim().max(255).nullable(),
  sku: yup.string().trim().max(100).nullable(),
  unitValue: yup.number().moreThan(0).nullable(),
  sellingPrice: yup.number().min(0).nullable(),
  isActive: yup.boolean().nullable(),
});

const orgProductVariantAttributeBodySchema = yup.object({
  key: yup.string().trim().min(1).max(100).required(),
  value: yup.string().trim().min(1).max(255).required(),
});

const parseOptionalProductImage = createSingleImageUploadMiddleware({
  fieldName: 'image',
  maxFileSizeBytes: 5 * 1024 * 1024,
});

/**
 * @param {{ productController: import('../controllers/product.controller.js').ProductController }} deps
 */
export const buildProductRouter = ({ productController }) => {
  const router = express.Router();
  router.use(authMiddleware());

  router.get('/variants', productController.listAllVariants);
  router.get('/organization-products', productController.listOrganizationProducts);
  router.get('/', productController.listProducts);
  router.get(
    '/:id',
    validateParams(productIdParamsSchema),
    productController.getProductById,
  );
  router.post(
    '/',
    parseOptionalProductImage,
    validateBody(productBodySchema),
    productController.createProduct,
  );
  router.put(
    '/:id',
    validateParams(productIdParamsSchema),
    parseOptionalProductImage,
    validateBody(productBodySchema),
    productController.updateProduct,
  );
  router.delete(
    '/:id',
    validateParams(productIdParamsSchema),
    productController.deleteProduct,
  );

  router.get(
    '/:id/variants',
    validateParams(productIdParamsSchema),
    productController.listVariants,
  );
  router.get(
    '/:id/variants/:variantId',
    validateParams(variantIdParamsSchema),
    productController.getVariantById,
  );
  router.post(
    '/:id/variants',
    validateParams(productIdParamsSchema),
    validateBody(variantBodySchema),
    productController.createVariant,
  );
  router.put(
    '/:id/variants/:variantId',
    validateParams(variantIdParamsSchema),
    validateBody(variantBodySchema),
    productController.updateVariant,
  );
  router.delete(
    '/:id/variants/:variantId',
    validateParams(variantIdParamsSchema),
    productController.deleteVariant,
  );

  router.get(
    '/:id/variants/:variantId/attributes',
    validateParams(variantIdParamsSchema),
    productController.listVariantAttributes,
  );
  router.get(
    '/:id/variants/:variantId/attributes/:attributeId',
    validateParams(attributeIdParamsSchema),
    productController.getVariantAttributeById,
  );
  router.post(
    '/:id/variants/:variantId/attributes',
    validateParams(variantIdParamsSchema),
    validateBody(variantAttributeBodySchema),
    productController.createVariantAttribute,
  );
  router.put(
    '/:id/variants/:variantId/attributes/:attributeId',
    validateParams(attributeIdParamsSchema),
    validateBody(variantAttributeBodySchema),
    productController.updateVariantAttribute,
  );
  router.delete(
    '/:id/variants/:variantId/attributes/:attributeId',
    validateParams(attributeIdParamsSchema),
    productController.deleteVariantAttribute,
  );

  router.post(
    '/organization-products/custom',
    validateBody(orgCustomProductBodySchema),
    productController.createOrganizationCustomProduct,
  );
  router.post(
    '/organization-products/:productId/override',
    validateParams(productRefParamsSchema),
    validateBody(orgProductOverrideBodySchema),
    productController.upsertOrganizationProductOverride,
  );
  router.put(
    '/organization-products/:orgProductId',
    validateParams(orgProductIdParamsSchema),
    validateBody(orgProductOverrideBodySchema),
    productController.updateOrganizationProduct,
  );
  router.delete(
    '/organization-products/:orgProductId',
    validateParams(orgProductIdParamsSchema),
    productController.deleteOrganizationProduct,
  );
  router.get(
    '/organization-products/:orgProductId/variants',
    validateParams(orgProductIdParamsSchema),
    productController.listOrganizationProductVariants,
  );
  router.post(
    '/organization-products/:orgProductId/variants',
    validateParams(orgProductIdParamsSchema),
    validateBody(orgProductVariantBodySchema),
    productController.createOrganizationProductVariant,
  );
  router.put(
    '/organization-products/variants/:orgProductVariantId',
    validateParams(orgProductVariantIdParamsSchema),
    validateBody(orgProductVariantBodySchema),
    productController.updateOrganizationProductVariant,
  );
  router.delete(
    '/organization-products/variants/:orgProductVariantId',
    validateParams(orgProductVariantIdParamsSchema),
    productController.deleteOrganizationProductVariant,
  );
  router.post(
    '/organization-products/variants/:orgProductVariantId/attributes',
    validateParams(orgProductVariantIdParamsSchema),
    validateBody(orgProductVariantAttributeBodySchema),
    productController.createOrganizationProductVariantAttribute,
  );
  router.put(
    '/organization-products/variants/attributes/:orgProductVariantAttributeId',
    validateParams(orgProductVariantAttributeIdParamsSchema),
    validateBody(orgProductVariantAttributeBodySchema),
    productController.updateOrganizationProductVariantAttribute,
  );
  router.delete(
    '/organization-products/variants/attributes/:orgProductVariantAttributeId',
    validateParams(orgProductVariantAttributeIdParamsSchema),
    productController.deleteOrganizationProductVariantAttribute,
  );
  return router;
};
