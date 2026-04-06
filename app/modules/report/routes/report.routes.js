import {
  authMiddleware,
  requireSystemUser,
  requirePermission,
} from '../../auth/middleware/index.js';
import { createAsyncRouter } from '../../../shared/middleware/exception.handler.js';
import { validateBody } from '../../../shared/middleware/validate.middleware.js';
import {
  reportQuerySchema,
  posOrderInvoiceGeographySchema,
  posDashboardSummarySchema,
  sectorsPerformanceSchema,
} from '../validators/report.validators.js';
import { ReportService } from '../service/report.service.js';
import { ReportController } from '../controller/report.controller.js';

const router = createAsyncRouter();

router.use(authMiddleware());
// Initialize service
const reportService = new ReportService();

// Initialize controller
const reportController = new ReportController({ reportService });

// All report routes require authentication
router.use(authMiddleware());

// Generate report
router.post(
  '/generate',
  requirePermission(['report:ge', 'report:ma']),
  validateBody(reportQuerySchema),
  reportController.generateReport,
);

// POS order & invoice by geography (country, country+zone, country+zone+woreda), date range, comparative
router.post(
  '/pos-order-invoice-by-geography',
  requireSystemUser(),
  validateBody(posOrderInvoiceGeographySchema),
  reportController.posOrderInvoiceByGeography,
);

// POS analytics/dashboard summary by status (orders by status, invoices by status & eims_status)
router.post(
  '/analytics/dashboard-summary',
  requireSystemUser(),
  validateBody(posDashboardSummarySchema),
  reportController.posDashboardSummaryByStatus,
);

// Sectors performance: expected vs actual with green / warning / red status
router.post(
  '/sectors-performance',
  requireSystemUser(),
  validateBody(sectorsPerformanceSchema),
  reportController.sectorsPerformance,
);

// Sectors performance grouped by status: On Target, Warning, At Risk
router.post(
  '/sectors-performance-by-status',
  requireSystemUser(),
  validateBody(sectorsPerformanceSchema),
  reportController.sectorsPerformanceByStatus,
);

export default router;
