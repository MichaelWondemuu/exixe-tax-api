import { createAsyncRouter } from '../../shared/middleware/exception.handler.js';
import {
  StampLabelBatchRepository,
  StampLabelEventRepository,
  StampLabelRepository,
  StampLabelTemplateRepository,
} from './repository/stamp-label.repository.js';
import { StampLabelQueryService } from './usecases/stamp-label/stamp-label.query.js';
import { StampLabelCommandService } from './usecases/stamp-label/stamp-label.command.js';
import { StampLabelTemplateQueryService } from './usecases/stamp-label-template/stamp-label-template.query.js';
import { StampLabelTemplateCommandService } from './usecases/stamp-label-template/stamp-label-template.command.js';
import { StampLabelController } from './controllers/stamp-label.controller.js';
import { StampLabelTemplateController } from './controllers/stamp-label-template.controller.js';
import { buildStampLabelRouter } from './routes/stamp-label.routes.js';
import { buildStampLabelTemplateRouter } from './routes/stamp-label-template.routes.js';

export const createStampLabelModule = () => {
  const stampLabelRepository = new StampLabelRepository();
  const stampLabelBatchRepository = new StampLabelBatchRepository();
  const stampLabelEventRepository = new StampLabelEventRepository();
  const stampLabelTemplateRepository = new StampLabelTemplateRepository();

  const stampLabelQueryService = new StampLabelQueryService({
    stampLabelRepository,
    stampLabelEventRepository,
    stampLabelBatchRepository,
  });
  const stampLabelCommandService = new StampLabelCommandService({
    stampLabelRepository,
    stampLabelEventRepository,
    stampLabelTemplateRepository,
    stampLabelBatchRepository,
  });
  const stampLabelTemplateQueryService = new StampLabelTemplateQueryService({
    stampLabelTemplateRepository,
  });
  const stampLabelTemplateCommandService = new StampLabelTemplateCommandService({
    stampLabelCommandService,
  });

  const stampLabelController = new StampLabelController({
    stampLabelQueryService,
    stampLabelCommandService,
  });
  const stampLabelTemplateController = new StampLabelTemplateController({
    stampLabelTemplateQueryService,
    stampLabelTemplateCommandService,
  });

  const router = createAsyncRouter();
  const {
    router: moduleRouter,
    adminRouter,
    publicRouter,
  } = buildStampLabelRouter({ stampLabelController });
  const { router: templateRouter, adminRouter: templateAdminRouter } =
    buildStampLabelTemplateRouter({ stampLabelTemplateController });

  router.use('/', publicRouter);
  router.use('/', moduleRouter);
  router.use('/', templateRouter);
  router.use('/admin', adminRouter);
  router.use('/admin', templateAdminRouter);

  return Object.freeze({
    router,
  });
};
