import { formatResponse } from '../../../shared/utils/response-formatter.js';

export class PublicPortalController {
  constructor({ publicPortalService }) {
    this.publicPortalService = publicPortalService;
  }

  verifyStamp = async (req, res) => {
    const result = await this.publicPortalService.verifyStamp(req, req.body || {});
    res.json(formatResponse(result));
  };

  listAnnouncements = async (req, res) => {
    const result = await this.publicPortalService.listAnnouncements(req.query || {});
    res.json(formatResponse(result));
  };

  listRestrictedProducts = async (req, res) => {
    const result = await this.publicPortalService.listRestrictedProducts(req.query || {});
    res.json(formatResponse(result));
  };

  listProducts = async (req, res) => {
    const result = await this.publicPortalService.listProducts(req.query || {});
    res.json(formatResponse(result));
  };

  listProductVariants = async (req, res) => {
    const result = await this.publicPortalService.listProductVariants(req.params.productId);
    res.json(formatResponse(result));
  };

  listProductTypes = async (_req, res) => {
    const result = await this.publicPortalService.listProductTypes();
    res.json(formatResponse(result));
  };

  listCategories = async (_req, res) => {
    const result = await this.publicPortalService.listCategories();
    res.json(formatResponse(result));
  };

  getCatalogBootstrap = async (req, res) => {
    const result = await this.publicPortalService.getCatalogBootstrap(req.query || {});
    res.json(formatResponse(result));
  };

  createReport = async (req, res) => {
    const result = await this.publicPortalService.createReport(req.body || {});
    res.status(201).json(formatResponse(result, 201));
  };

  getReportStatus = async (req, res) => {
    const result = await this.publicPortalService.getReportStatus(req.params.reference);
    res.json(formatResponse(result));
  };

  listNotifications = async (req, res) => {
    const result = await this.publicPortalService.listNotifications(req.query || {});
    res.json(formatResponse(result));
  };

  adminCreateAnnouncement = async (req, res) => {
    const result = await this.publicPortalService.adminCreateAnnouncement(req.body || {});
    res.status(201).json(formatResponse(result, 201));
  };

  adminListReports = async (req, res) => {
    const result = await this.publicPortalService.adminListReports(req.query || {});
    res.json(formatResponse(result));
  };

  adminUpdateReportStatus = async (req, res) => {
    const result = await this.publicPortalService.adminUpdateReportStatus(
      req.params.reference,
      req.body || {},
    );
    res.json(formatResponse(result));
  };

  adminCreateNotification = async (req, res) => {
    const result = await this.publicPortalService.adminCreateNotification(req.body || {});
    res.status(201).json(formatResponse(result, 201));
  };
}
