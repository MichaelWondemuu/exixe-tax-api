import { createAsyncRouter } from '../../shared/middleware/exception.handler.js';
import { ProductRepository } from './repository/product.repository.js';
import { OrganizationProductRepository } from './repository/organization-product.repository.js';
import { CategoryRepository } from '../lookup/repository/category.repository.js';
import { ProductTypeRepository } from '../lookup/repository/product-type.repository.js';
import { MeasurementRepository } from '../lookup/repository/measurement.repository.js';
import { ProductQueryService } from './usecases/product/product.query.js';
import { ProductCommandService } from './usecases/product/product.command.js';
import { ProductController } from './controllers/product.controller.js';
import { buildProductRouter } from './routes/product.routes.js';

export const createProductModule = () => {
  const productRepository = new ProductRepository();
  const organizationProductRepository = new OrganizationProductRepository();
  const categoryRepository = new CategoryRepository();
  const productTypeRepository = new ProductTypeRepository();
  const measurementRepository = new MeasurementRepository();

  const productQueryService = new ProductQueryService({
    productRepository,
    organizationProductRepository,
  });
  const productCommandService = new ProductCommandService({
    productRepository,
    organizationProductRepository,
    categoryRepository,
    productTypeRepository,
    measurementRepository,
  });

  const productController = new ProductController({
    productQueryService,
    productCommandService,
  });

  const router = createAsyncRouter();
  router.use('/', buildProductRouter({ productController }));

  return Object.freeze({
    router,
  });
};
