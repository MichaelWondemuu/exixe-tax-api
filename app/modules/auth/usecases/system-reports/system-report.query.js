/**
 * Query-side facade for system report use cases (read-only).
 */
export class SystemReportQueryService {
  /**
   * @param {{ systemReportService: import('./system-report.service.js').SystemReportService }} deps
   */
  constructor({ systemReportService }) {
    this.systemReportService = systemReportService;
  }

  getSystemUserReport = () =>
    this.systemReportService.getSystemUserReport();
}
