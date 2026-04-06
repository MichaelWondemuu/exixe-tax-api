import { createAsyncRouter } from '../../shared/middleware/exception.handler.js';
import { RegionRepository } from './repository/region.repository.js';
import { ZoneRepository } from './repository/zone.repository.js';
import { WoredaRepository } from './repository/woreda.repository.js';
import { SectorRepository } from './repository/sector.repository.js';
import { VerificationBodyRepository } from './repository/verification-body.repository.js';
import { LicensingAuthorityRepository } from './repository/licensing-authority.repository.js';
import { CategoryRepository } from './repository/category.repository.js';
import { ProductTypeRepository } from './repository/product-type.repository.js';
import { MeasurementRepository } from './repository/measurement.repository.js';
import { CitiesService } from './usecases/cities/cities.service.js';
import { CitiesCommandService } from './usecases/cities/cities.command.js';
import { CitiesQueryService } from './usecases/cities/cities.query.js';
import { SectorService } from './usecases/sectors/sector.service.js';
import { SectorCommandService } from './usecases/sectors/sector.command.js';
import { SectorQueryService } from './usecases/sectors/sector.query.js';
import { VerificationBodyQueryService } from './usecases/verification-bodies/verification-body.query.js';
import { LicensingAuthorityQueryService } from './usecases/licensing-authorities/licensing-authority.query.js';
import { CategoryQueryService } from './usecases/categories/category.query.js';
import { CategoryCommandService } from './usecases/categories/category.command.js';
import { ProductTypeQueryService } from './usecases/product-types/product-type.query.js';
import { ProductTypeCommandService } from './usecases/product-types/product-type.command.js';
import { MeasurementQueryService } from './usecases/measurements/measurement.query.js';
import { MeasurementCommandService } from './usecases/measurements/measurement.command.js';
import { CitiesController } from './controllers/cities.controller.js';
import { SectorController } from './controllers/sector.controller.js';
import { VerificationBodyController } from './controllers/verification-body.controller.js';
import { LicensingAuthorityController } from './controllers/licensing-authority.controller.js';
import { CategoryController } from './controllers/category.controller.js';
import { ProductTypeController } from './controllers/product-type.controller.js';
import { MeasurementController } from './controllers/measurement.controller.js';
import { buildCitiesRouter } from './routes/cities.routes.js';
import { buildSectorRouter } from './routes/sector.routes.js';
import { buildVerificationBodyRouter } from './routes/verification-body.routes.js';
import { buildLicensingAuthorityRouter } from './routes/licensing-authority.routes.js';
import { buildCategoryRouter } from './routes/category.routes.js';
import { buildProductTypeRouter } from './routes/product-type.routes.js';
import { buildMeasurementRouter } from './routes/measurement.routes.js';

export const createLookupModule = () => {
  const regionRepository = new RegionRepository();
  const zoneRepository = new ZoneRepository();
  const woredaRepository = new WoredaRepository();
  const sectorRepository = new SectorRepository();
  const verificationBodyRepository = new VerificationBodyRepository();
  const licensingAuthorityRepository = new LicensingAuthorityRepository();
  const categoryRepository = new CategoryRepository();
  const productTypeRepository = new ProductTypeRepository();
  const measurementRepository = new MeasurementRepository();

  const citiesService = new CitiesService({
    regionRepository,
    zoneRepository,
    woredaRepository,
  });
  const citiesCommandService = new CitiesCommandService({ citiesService });
  const citiesQueryService = new CitiesQueryService({ citiesService });

  const sectorService = new SectorService({
    sectorRepository,
    verificationBodyRepository,
    licensingAuthorityRepository,
  });
  const sectorCommandService = new SectorCommandService({ sectorService });
  const sectorQueryService = new SectorQueryService({ sectorService });

  const verificationBodyQueryService = new VerificationBodyQueryService({
    verificationBodyRepository,
  });
  const licensingAuthorityQueryService = new LicensingAuthorityQueryService({
    licensingAuthorityRepository,
  });
  const categoryQueryService = new CategoryQueryService({
    categoryRepository,
  });
  const categoryCommandService = new CategoryCommandService({
    categoryRepository,
  });
  const productTypeQueryService = new ProductTypeQueryService({
    productTypeRepository,
  });
  const productTypeCommandService = new ProductTypeCommandService({
    productTypeRepository,
  });
  const measurementQueryService = new MeasurementQueryService({
    measurementRepository,
  });
  const measurementCommandService = new MeasurementCommandService({
    measurementRepository,
  });

  const citiesController = new CitiesController({
    citiesQueryService,
    citiesCommandService,
  });
  const sectorController = new SectorController({
    sectorQueryService,
    sectorCommandService,
  });
  const verificationBodyController = new VerificationBodyController({
    verificationBodyQueryService,
  });
  const licensingAuthorityController = new LicensingAuthorityController({
    licensingAuthorityQueryService,
  });
  const categoryController = new CategoryController({
    categoryQueryService,
    categoryCommandService,
  });
  const productTypeController = new ProductTypeController({
    productTypeQueryService,
    productTypeCommandService,
  });
  const measurementController = new MeasurementController({
    measurementQueryService,
    measurementCommandService,
  });

  const router = createAsyncRouter();
  router.use(
    '/cities',
    buildCitiesRouter({ citiesController }),
  );
  router.use('/sectors', buildSectorRouter({ sectorController }));
  router.use(
    '/verification-bodies',
    buildVerificationBodyRouter({ verificationBodyController }),
  );
  router.use(
    '/licensing-authorities',
    buildLicensingAuthorityRouter({ licensingAuthorityController }),
  );
  router.use('/categories', buildCategoryRouter({ categoryController }));
  router.use('/product-types', buildProductTypeRouter({ productTypeController }));
  router.use('/measurements', buildMeasurementRouter({ measurementController }));

  return Object.freeze({
    router,
  });
};
