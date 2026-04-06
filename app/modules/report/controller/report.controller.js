export class ReportController {
  constructor({ reportService }) {
    this.reportService = reportService;
  }

  /**
   * Generate report
   * POST /reports/generate
   */
  generateReport = async (req, res, next) => {
    try {
      const response = await this.reportService.generateReport(req.body, req);
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * POS order & invoice report by organization geography (country, country+zone, country+zone+woreda)
   * with date range and optional comparative. Optional filters: taxType, taxName, sectorId, organizationIds.
   * POST /reports/pos-order-invoice-by-geography
   */
  posOrderInvoiceByGeography = async (req, res, next) => {
    try {
      const dto = req.body;
      const body = {
        country: dto.country,
        regionId: dto.regionId,
        zoneId: dto.zoneId,
        woredaId: dto.woredaId,
        sectorId: dto.sectorId ?? null,
        sectorIds: dto.sectorIds,
        organizationIds: dto.organizationIds,
        taxType: dto.taxType,
        taxName: dto.taxName,
        dateRange: dto.dateRange
          ? {
              range: dto.dateRange.range,
              startDate: dto.dateRange.startDate,
              endDate: dto.dateRange.endDate,
            }
          : undefined,
        compareWithPrevious: dto.compareWithPrevious,
      };
      const response = await this.reportService.getPosOrderInvoiceByGeography(body, req);
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * POS dashboard summary by status. POST /reports/analytics/dashboard-summary
   * Optional body: { country?, regionId?, zoneId?, woredaId?, sectorId?, organizationIds?, taxType?, taxName?, dateRange? }
   */
  posDashboardSummaryByStatus = async (req, res, next) => {
    try {
      const body = req.body || {};
      const payload = {
        country: body.country,
        regionId: body.regionId,
        zoneId: body.zoneId,
        woredaId: body.woredaId,
        sectorId: body.sectorId ?? null,
        sectorIds: body.sectorIds,
        organizationIds: body.organizationIds,
        taxType: body.taxType,
        taxName: body.taxName,
        dateRange: body.dateRange
          ? {
              range: body.dateRange.range,
              startDate: body.dateRange.startDate,
              endDate: body.dateRange.endDate,
            }
          : undefined,
      };
      const response = await this.reportService.getPosDashboardSummaryByStatus(payload, req);
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Sectors performance: expected (from Sector) vs actual (from POS orders), with green/warning/red status.
   * POST /reports/sectors-performance
   * Body: { dateRange: { range, startDate?, endDate? }, country?, regionId?, zoneId?, woredaId?, sectorId?, organizationIds?, verificationBodyName?, licensingAuthorityName? }
   */
  sectorsPerformance = async (req, res, next) => {
    try {
      const body = req.body || {};
      const payload = {
        dateRange: body.dateRange
          ? {
              range: body.dateRange.range,
              startDate: body.dateRange.startDate,
              endDate: body.dateRange.endDate,
            }
          : undefined,
        country: body.country,
        regionId: body.regionId,
        zoneId: body.zoneId,
        woredaId: body.woredaId,
        sectorId: body.sectorId ?? null,
        sectorIds: body.sectorIds,
        organizationIds: body.organizationIds,
        verificationBodyName: body.verificationBodyName,
        licensingAuthorityName: body.licensingAuthorityName,
      };
      const response = await this.reportService.getSectorsPerformance(payload, req);
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Sectors performance grouped by status: On Target, Warning, At Risk.
   * POST /reports/sectors-performance-by-status
   * Body: same as sectors-performance (dateRange required, optional filters including verificationBodyName, licensingAuthorityName).
   */
  sectorsPerformanceByStatus = async (req, res, next) => {
    try {
      const body = req.body || {};
      const payload = {
        dateRange: body.dateRange
          ? {
              range: body.dateRange.range,
              startDate: body.dateRange.startDate,
              endDate: body.dateRange.endDate,
            }
          : undefined,
        country: body.country,
        regionId: body.regionId,
        zoneId: body.zoneId,
        woredaId: body.woredaId,
        sectorId: body.sectorId ?? null,
        sectorIds: body.sectorIds,
        organizationIds: body.organizationIds,
        verificationBodyName: body.verificationBodyName,
        licensingAuthorityName: body.licensingAuthorityName,
      };
      const response = await this.reportService.getSectorsPerformanceByStatus(payload, req);
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
}
