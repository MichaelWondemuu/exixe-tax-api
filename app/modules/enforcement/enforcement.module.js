import { createAsyncRouter } from '../../shared/middleware/exception.handler.js';
import { models } from '../../shared/db/data-source.js';
import { CounterfeitReportRepository } from './repository/counterfeit-report.repository.js';
import { CounterfeitReportCommandService } from './usecases/counterfeit-report.command.js';
import { CounterfeitReportQueryService } from './usecases/counterfeit-report.query.js';
import { CounterfeitCaseCommandService } from './usecases/counterfeit-case.command.js';
import { CounterfeitCaseQueryService } from './usecases/counterfeit-case.query.js';
import { CounterfeitController } from './controllers/counterfeit.controller.js';
import { SuspiciousProductReportController } from './controllers/suspicious-product-report.controller.js';
import { SuspiciousProductReportRepository } from './repository/suspicious-product-report.repository.js';
import { SuspiciousProductReportCommandService } from './usecases/suspicious-product-report.command.js';
import { SuspiciousProductReportQueryService } from './usecases/suspicious-product-report.query.js';
import { ProductRecallRepository } from './repository/product-recall.repository.js';
import { ProductRecallCommandService } from './usecases/product-recall.command.js';
import { ProductRecallQueryService } from './usecases/product-recall.query.js';
import { ProductRecallController } from './controllers/product-recall.controller.js';
import { buildEnforcementRouter } from './routes/enforcement.routes.js';

export const createEnforcementModule = () => {
  const counterfeitReportRepository = new CounterfeitReportRepository({
    Model: models.CounterfeitReport,
  });
  const suspiciousProductReportRepository = new SuspiciousProductReportRepository({
    Model: models.SuspiciousProductReport,
  });
  const productRecallRepository = new ProductRecallRepository({
    Model: models.ProductRecall,
  });

  const counterfeitReportCommandService = new CounterfeitReportCommandService({
    counterfeitReportRepository,
  });
  const counterfeitReportQueryService = new CounterfeitReportQueryService({
    counterfeitReportRepository,
  });
  const suspiciousProductReportCommandService =
    new SuspiciousProductReportCommandService({
      suspiciousProductReportRepository,
    });
  const suspiciousProductReportQueryService =
    new SuspiciousProductReportQueryService({
      suspiciousProductReportRepository,
    });
  const productRecallCommandService = new ProductRecallCommandService({
    productRecallRepository,
  });
  const productRecallQueryService = new ProductRecallQueryService({
    productRecallRepository,
  });
  const counterfeitCaseQueryService = new CounterfeitCaseQueryService();
  const counterfeitCaseCommandService = new CounterfeitCaseCommandService({
    counterfeitCaseQueryService,
  });

  const counterfeitController = new CounterfeitController({
    counterfeitReportCommandService,
    counterfeitReportQueryService,
    counterfeitCaseCommandService,
    counterfeitCaseQueryService,
  });
  const suspiciousProductReportController = new SuspiciousProductReportController({
    suspiciousProductReportCommandService,
    suspiciousProductReportQueryService,
  });
  const productRecallController = new ProductRecallController({
    productRecallCommandService,
    productRecallQueryService,
  });

  const router = createAsyncRouter();
  router.use(
    '/',
    buildEnforcementRouter({
      counterfeitController,
      suspiciousProductReportController,
      productRecallController,
    }),
  );

  return Object.freeze({ router });
};
