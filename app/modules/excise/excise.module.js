import { createAsyncRouter } from '../../shared/middleware/exception.handler.js';
import { ExciseFacilityRepository } from './repository/facility.repository.js';
import { ExciseDeliveryNoteRepository } from './repository/delivery-note.repository.js';
import { ExciseStampRequestRepository } from './repository/stamp-request.repository.js';
import { ExciseStampForecastRepository } from './repository/forecast.repository.js';
import { ExciseStampStockEventRepository } from './repository/stamp-stock-event.repository.js';
import { ExciseStampVerificationRepository } from './repository/stamp-verification.repository.js';
import { ExciseCommandService } from './usecases/excise/excise.command.js';
import { ExciseQueryService } from './usecases/excise/excise.query.js';
import { ExciseController } from './controllers/excise.controller.js';
import { buildExciseRouter } from './routes/excise.routes.js';

export const createExciseModule = () => {
  const facilityRepository = new ExciseFacilityRepository();
  const deliveryNoteRepository = new ExciseDeliveryNoteRepository();
  const stampRequestRepository = new ExciseStampRequestRepository();
  const forecastRepository = new ExciseStampForecastRepository();
  const stockEventRepository = new ExciseStampStockEventRepository();
  const verificationRepository = new ExciseStampVerificationRepository();

  const exciseCommandService = new ExciseCommandService({
    facilityRepository,
    deliveryNoteRepository,
    stampRequestRepository,
    forecastRepository,
    stockEventRepository,
    verificationRepository,
  });
  const exciseQueryService = new ExciseQueryService({
    facilityRepository,
    deliveryNoteRepository,
    stampRequestRepository,
    forecastRepository,
    stockEventRepository,
    verificationRepository,
  });

  const exciseController = new ExciseController({
    exciseCommandService,
    exciseQueryService,
  });

  const router = createAsyncRouter();
  router.use('/', buildExciseRouter({ exciseController }));

  return Object.freeze({ router });
};
