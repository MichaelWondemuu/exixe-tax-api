import { createAsyncRouter } from '../../shared/middleware/exception.handler.js';
import { PredeclarationRepository } from './repository/predeclaration.repository.js';
import { PredeclarationQueryService } from './usecases/predeclarations/predeclaration.query.js';
import { PredeclarationCommandService } from './usecases/predeclarations/predeclaration.command.js';
import { PredeclarationController } from './controllers/predeclaration.controller.js';
import { buildPredeclarationRouter } from './routes/predeclaration.routes.js';

export const createPredeclarationModule = () => {
  const predeclarationRepository = new PredeclarationRepository();
  const predeclarationQueryService = new PredeclarationQueryService({
    predeclarationRepository,
  });
  const predeclarationCommandService = new PredeclarationCommandService({
    predeclarationRepository,
  });
  const predeclarationController = new PredeclarationController({
    predeclarationQueryService,
    predeclarationCommandService,
  });

  const router = createAsyncRouter();
  router.use('/', buildPredeclarationRouter({ predeclarationController }));

  return Object.freeze({ router });
};
