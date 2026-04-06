import reportRoutes from './routes/report.routes.js';
import { createAsyncRouter } from '../../shared/middleware/exception.handler.js';

export const createReportModule = () => {
  const mainRouter = createAsyncRouter();
  mainRouter.use('/reports', reportRoutes);

  return Object.freeze({
    router: mainRouter,
  });
};
