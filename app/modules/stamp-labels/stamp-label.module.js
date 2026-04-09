import { createAsyncRouter } from '../../shared/middleware/exception.handler.js';
import {
  StampLabelEventRepository,
  StampLabelRepository,
} from './repository/stamp-label.repository.js';
import { StampLabelQueryService } from './usecases/stamp-label/stamp-label.query.js';
import { StampLabelCommandService } from './usecases/stamp-label/stamp-label.command.js';
import { StampLabelController } from './controllers/stamp-label.controller.js';
import { buildStampLabelRouter } from './routes/stamp-label.routes.js';

export const createStampLabelModule = () => {
  const stampLabelRepository = new StampLabelRepository();
  const stampLabelEventRepository = new StampLabelEventRepository();

  const stampLabelQueryService = new StampLabelQueryService({
    stampLabelRepository,
    stampLabelEventRepository,
  });
  const stampLabelCommandService = new StampLabelCommandService({
    stampLabelRepository,
    stampLabelEventRepository,
  });

  const stampLabelController = new StampLabelController({
    stampLabelQueryService,
    stampLabelCommandService,
  });

  const router = createAsyncRouter();
  const {
    router: moduleRouter,
    adminRouter,
    publicRouter,
  } = buildStampLabelRouter({ stampLabelController });

  router.use('/', publicRouter);
  router.use('/', moduleRouter);
  router.use('/admin', adminRouter);

  return Object.freeze({
    router,
  });
};
