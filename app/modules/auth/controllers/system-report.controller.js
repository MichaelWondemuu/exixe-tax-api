import { HttpError } from '../../../shared/utils/http-error.js';

/**
 * Controller for system-level reports (system users only).
 */
export class SystemReportController {
  constructor({ systemReportQueryService }) {
    this.systemReportQueryService = systemReportQueryService;
  }

  /**
   * GET /system/user-report
   * Returns counts of orgs, users (total and per org), permissions, resources, etc.
   */
  getSystemUserReport = async (req, res, next) => {
    try {
      const report = await this.systemReportQueryService.getSystemUserReport();
      res.json(report);
    } catch (error) {
      if (error instanceof HttpError) throw error;
      next(error);
    }
  };
}
