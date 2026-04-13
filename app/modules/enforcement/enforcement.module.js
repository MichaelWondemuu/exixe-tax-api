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
import { ProductionRecordRepository } from './repository/production-record.repository.js';
import { ProductionRecordCommandService } from './usecases/production-record.command.js';
import { ProductionRecordQueryService } from './usecases/production-record.query.js';
import { ProductionRecordController } from './controllers/production-record.controller.js';
import { StockSnapshotRepository } from './repository/stock-snapshot.repository.js';
import { StockSnapshotCommandService } from './usecases/stock-snapshot.command.js';
import { StockSnapshotQueryService } from './usecases/stock-snapshot.query.js';
import { StockSnapshotController } from './controllers/stock-snapshot.controller.js';
import { ReconciliationRunRepository } from './repository/reconciliation-run.repository.js';
import { ReconciliationItemRepository } from './repository/reconciliation-item.repository.js';
import { ReconciliationCommandService } from './usecases/reconciliation.command.js';
import { ReconciliationQueryService } from './usecases/reconciliation.query.js';
import { ReconciliationController } from './controllers/reconciliation.controller.js';
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
  const productionRecordRepository = new ProductionRecordRepository({
    Model: models.ProductionRecord,
  });
  const stockSnapshotRepository = new StockSnapshotRepository({
    Model: models.StockSnapshot,
  });
  const reconciliationRunRepository = new ReconciliationRunRepository({
    Model: models.ReconciliationRun,
  });
  const reconciliationItemRepository = new ReconciliationItemRepository({
    Model: models.ReconciliationItem,
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
  const productionRecordCommandService = new ProductionRecordCommandService({
    productionRecordRepository,
  });
  const productionRecordQueryService = new ProductionRecordQueryService();
  const stockSnapshotCommandService = new StockSnapshotCommandService({
    stockSnapshotRepository,
  });
  const stockSnapshotQueryService = new StockSnapshotQueryService();
  const reconciliationCommandService = new ReconciliationCommandService({
    reconciliationRunRepository,
    reconciliationItemRepository,
  });
  const reconciliationQueryService = new ReconciliationQueryService({
    reconciliationRunRepository,
    reconciliationItemRepository,
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
  const productionRecordController = new ProductionRecordController({
    productionRecordCommandService,
    productionRecordQueryService,
  });
  const stockSnapshotController = new StockSnapshotController({
    stockSnapshotCommandService,
    stockSnapshotQueryService,
  });
  const reconciliationController = new ReconciliationController({
    reconciliationCommandService,
    reconciliationQueryService,
  });

  const router = createAsyncRouter();
  router.use(
    '/',
    buildEnforcementRouter({
      counterfeitController,
      suspiciousProductReportController,
      productRecallController,
      productionRecordController,
      stockSnapshotController,
      reconciliationController,
    }),
  );

  return Object.freeze({ router });
};
