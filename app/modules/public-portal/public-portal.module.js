import { createAsyncRouter } from '../../shared/middleware/exception.handler.js';
import {
  StampLabelBatchRepository,
  StampLabelEventRepository,
  StampLabelRepository,
  StampLabelTemplateRepository,
} from '../stamp-labels/repository/stamp-label.repository.js';
import { StampLabelCommandService } from '../stamp-labels/usecases/stamp-label/stamp-label.command.js';
import { PublicPortalService } from './usecases/public-portal/public-portal.service.js';
import { PublicPortalController } from './controllers/public-portal.controller.js';
import { buildPublicPortalRouter } from './routes/public-portal.routes.js';
import {
  PublicPortalAnnouncementRepository,
  PublicPortalNotificationRepository,
  PublicPortalReportRepository,
} from './repository/public-portal.repository.js';

export const createPublicPortalModule = () => {
  const stampLabelRepository = new StampLabelRepository();
  const stampLabelBatchRepository = new StampLabelBatchRepository();
  const stampLabelEventRepository = new StampLabelEventRepository();
  const stampLabelTemplateRepository = new StampLabelTemplateRepository();

  const stampLabelCommandService = new StampLabelCommandService({
    stampLabelRepository,
    stampLabelEventRepository,
    stampLabelTemplateRepository,
    stampLabelBatchRepository,
  });
  const announcementRepository = new PublicPortalAnnouncementRepository();
  const reportRepository = new PublicPortalReportRepository();
  const notificationRepository = new PublicPortalNotificationRepository();

  const publicPortalService = new PublicPortalService({
    stampLabelCommandService,
    stampLabelRepository,
    announcementRepository,
    reportRepository,
    notificationRepository,
  });
  const publicPortalController = new PublicPortalController({
    publicPortalService,
  });

  const router = createAsyncRouter();
  router.use('/', buildPublicPortalRouter({ publicPortalController }));

  return Object.freeze({ router });
};
