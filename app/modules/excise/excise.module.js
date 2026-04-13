import { createAsyncRouter } from '../../shared/middleware/exception.handler.js';
import { ExciseFacilityRepository } from './repository/facility.repository.js';
import { ExciseDeliveryNoteRepository } from './repository/delivery-note.repository.js';
import { ExciseStampRequestRepository } from './repository/stamp-request.repository.js';
import { ExciseStampForecastRepository } from './repository/forecast.repository.js';
import { ExciseStampStockEventRepository } from './repository/stamp-stock-event.repository.js';
import { ExciseStampVerificationRepository } from './repository/stamp-verification.repository.js';
import { ExciseConfigRepository } from './repository/config.repository.js';
import { ExciseCommandService } from './usecases/excise/excise.command.js';
import { ExciseQueryService } from './usecases/excise/excise.query.js';
import { buildExciseRouter } from './routes/excise.routes.js';
import { FacilityQueryService } from './usecases/facility/facility.query.js';
import { FacilityCommandService } from './usecases/facility/facility.command.js';
import { FacilityController } from './controllers/facility.controller.js';
import { DeliveryNoteQueryService } from './usecases/delivery-note/delivery-note.query.js';
import { DeliveryNoteCommandService } from './usecases/delivery-note/delivery-note.command.js';
import { DeliveryNoteController } from './controllers/delivery-note.controller.js';
import { StampRequestQueryService } from './usecases/stamp-request/stamp-request.query.js';
import { StampRequestCommandService } from './usecases/stamp-request/stamp-request.command.js';
import { StampRequestController } from './controllers/stamp-request.controller.js';
import { ForecastQueryService } from './usecases/forecast/forecast.query.js';
import { ForecastCommandService } from './usecases/forecast/forecast.command.js';
import { ForecastController } from './controllers/forecast.controller.js';
import { StampStockEventQueryService } from './usecases/stamp-stock-event/stamp-stock-event.query.js';
import { StampStockEventCommandService } from './usecases/stamp-stock-event/stamp-stock-event.command.js';
import { StampStockEventController } from './controllers/stamp-stock-event.controller.js';
import { StampVerificationQueryService } from './usecases/stamp-verification/stamp-verification.query.js';
import { StampVerificationCommandService } from './usecases/stamp-verification/stamp-verification.command.js';
import { StampVerificationController } from './controllers/stamp-verification.controller.js';
import { ExciseConfigQueryService } from './usecases/config/config.query.js';
import { ExciseConfigCommandService } from './usecases/config/config.command.js';
import { ExciseConfigController } from './controllers/config.controller.js';

export const createExciseModule = () => {
  const facilityRepository = new ExciseFacilityRepository();
  const deliveryNoteRepository = new ExciseDeliveryNoteRepository();
  const stampRequestRepository = new ExciseStampRequestRepository();
  const forecastRepository = new ExciseStampForecastRepository();
  const stockEventRepository = new ExciseStampStockEventRepository();
  const verificationRepository = new ExciseStampVerificationRepository();
  const configRepository = new ExciseConfigRepository();

  const exciseCommandService = new ExciseCommandService({
    facilityRepository,
    deliveryNoteRepository,
    stampRequestRepository,
    forecastRepository,
    stockEventRepository,
    verificationRepository,
    configRepository,
  });
  const exciseQueryService = new ExciseQueryService({
    facilityRepository,
    deliveryNoteRepository,
    stampRequestRepository,
    forecastRepository,
    stockEventRepository,
    verificationRepository,
    configRepository,
  });

  const facilityQueryService = new FacilityQueryService({ exciseQueryService });
  const facilityCommandService = new FacilityCommandService({ exciseCommandService });
  const deliveryNoteQueryService = new DeliveryNoteQueryService({ exciseQueryService });
  const deliveryNoteCommandService = new DeliveryNoteCommandService({
    exciseCommandService,
  });
  const stampRequestQueryService = new StampRequestQueryService({ exciseQueryService });
  const stampRequestCommandService = new StampRequestCommandService({
    exciseCommandService,
  });
  const forecastQueryService = new ForecastQueryService({ exciseQueryService });
  const forecastCommandService = new ForecastCommandService({ exciseCommandService });
  const stampStockEventQueryService = new StampStockEventQueryService({ exciseQueryService });
  const stampStockEventCommandService = new StampStockEventCommandService({
    exciseCommandService,
  });
  const stampVerificationQueryService = new StampVerificationQueryService({
    exciseQueryService,
  });
  const stampVerificationCommandService = new StampVerificationCommandService({
    exciseCommandService,
  });
  const exciseConfigQueryService = new ExciseConfigQueryService({ exciseQueryService });
  const exciseConfigCommandService = new ExciseConfigCommandService({
    exciseCommandService,
  });

  const facilityController = new FacilityController({
    facilityQueryService,
    facilityCommandService,
  });
  const deliveryNoteController = new DeliveryNoteController({
    deliveryNoteQueryService,
    deliveryNoteCommandService,
  });
  const stampRequestController = new StampRequestController({
    stampRequestQueryService,
    stampRequestCommandService,
  });
  const forecastController = new ForecastController({
    forecastQueryService,
    forecastCommandService,
  });
  const stampStockEventController = new StampStockEventController({
    stampStockEventQueryService,
    stampStockEventCommandService,
  });
  const stampVerificationController = new StampVerificationController({
    stampVerificationQueryService,
    stampVerificationCommandService,
  });
  const exciseConfigController = new ExciseConfigController({
    exciseConfigQueryService,
    exciseConfigCommandService,
  });

  const router = createAsyncRouter();
  router.use(
    '/',
    buildExciseRouter({
      facilityController,
      deliveryNoteController,
      stampRequestController,
      forecastController,
      stampStockEventController,
      stampVerificationController,
      exciseConfigController,
    }),
  );

  return Object.freeze({ router });
};
