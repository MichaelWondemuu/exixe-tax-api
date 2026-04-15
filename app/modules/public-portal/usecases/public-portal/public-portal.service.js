import { randomUUID } from 'crypto';
import { HttpError } from '../../../../shared/utils/http-error.js';
import { models } from '../../../../shared/db/data-source.js';
import { ensurePublicPortalSchema } from './ensure-public-portal-schema.js';
import { PublicPortalResponse } from './public-portal-response.js';

const REPORT_STATUS = Object.freeze({
  SUBMITTED: 'SUBMITTED',
  UNDER_REVIEW: 'UNDER_REVIEW',
  ACTION_TAKEN: 'ACTION_TAKEN',
  CLOSED: 'CLOSED',
});

function mapVerificationStatus(rawStatus) {
  switch (String(rawStatus || '').toUpperCase()) {
    case 'VERIFIED':
    case 'AUTHENTIC':
      return 'VALID';
    case 'SUSPECT':
      return 'SUSPICIOUS';
    case 'CANCELLED_UI':
      return 'WARNING';
    case 'NOT_FOUND':
    default:
      return 'INVALID';
  }
}

function buildReportReference() {
  const year = new Date().getUTCFullYear();
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `RPT-${year}-${random}`;
}

export class PublicPortalService {
  constructor({
    stampLabelCommandService,
    stampLabelRepository,
    announcementRepository,
    reportRepository,
    notificationRepository,
  }) {
    this.stampLabelCommandService = stampLabelCommandService;
    this.stampLabelRepository = stampLabelRepository;
    this.announcementRepository = announcementRepository;
    this.reportRepository = reportRepository;
    this.notificationRepository = notificationRepository;
  }

  verifyStamp = async (req, body = {}) => {
    await ensurePublicPortalSchema();
    const stampUid = String(body.stampUid || body.code || '').trim();
    if (!stampUid) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'stampUid (or code) is required');
    }

    const result = await this.stampLabelCommandService.verifyByUid(req, {
      stampUid,
      channel: body.channel || 'WEB_PORTAL',
      locationCode: body.locationCode || null,
      remarks: body.remarks || null,
    });

    return {
      stampUid,
      verificationStatus: mapVerificationStatus(result?.status),
      result,
      nextActions: ['REPORT_SUSPICIOUS_ACTIVITY', 'VIEW_RESTRICTED_PRODUCTS'],
    };
  };

  listAnnouncements = async (query = {}) => {
    await ensurePublicPortalSchema();
    const category = String(query.category || '').trim().toUpperCase();
    const priority = String(query.priority || '').trim().toUpperCase();
    const rows = await this.announcementRepository.findActive(null, {
      category,
      priority,
    });
    return rows.map((x) => PublicPortalResponse.toAnnouncement(x));
  };

  listRestrictedProducts = async () => {
    const rows = await this.stampLabelRepository.findRestrictedProducts(null, 500);
    return rows.map((x) => PublicPortalResponse.toRestrictedProduct(x));
  };

  listProducts = async (query = {}) => {
    await ensurePublicPortalSchema();
    const limit = Math.min(Math.max(Number(query.limit || 100), 1), 500);
    const rows = await models.Product.findAll({
      where: { isActive: true },
      attributes: [
        'id',
        'name',
        'description',
        'imageUrl',
        'categoryId',
        'productTypeId',
        'measurementId',
        'updatedAt',
      ],
      include: [
        { model: models.Category, as: 'category', attributes: ['id', 'name', 'code'] },
        { model: models.ProductType, as: 'productType', attributes: ['id', 'name'] },
        { model: models.Measurement, as: 'measurement', attributes: ['id', 'name', 'shortForm'] },
      ],
      order: [['updatedAt', 'DESC']],
      limit,
    });
    return rows.map((x) => PublicPortalResponse.toPortalProduct(x));
  };

  listProductVariants = async (productId) => {
    await ensurePublicPortalSchema();
    const targetId = String(productId || '').trim();
    const product = await models.Product.findByPk(targetId, {
      attributes: ['id', 'name', 'isActive'],
    });
    if (!product) {
      throw new HttpError(404, 'NOT_FOUND', 'Product not found');
    }
    const rows = await models.ProductVariant.findAll({
      where: { productId: targetId, isActive: true },
      attributes: ['id', 'productId', 'name', 'sku', 'unitValue', 'sellingPrice', 'isActive'],
      include: [
        {
          model: models.ProductVariantAttribute,
          as: 'attributes',
          attributes: ['id', 'variantId', 'key', 'value'],
        },
      ],
      order: [['updatedAt', 'DESC']],
      limit: 500,
    });
    return {
      product: product.get({ plain: true }),
      count: rows.length,
      variants: rows.map((x) => PublicPortalResponse.toPortalVariant(x)),
    };
  };

  listProductTypes = async () => {
    await ensurePublicPortalSchema();
    const rows = await models.ProductType.findAll({
      attributes: ['id', 'name', 'updatedAt'],
      order: [['name', 'ASC']],
      limit: 500,
    });
    return rows.map((x) => PublicPortalResponse.toPortalProductType(x));
  };

  listCategories = async () => {
    await ensurePublicPortalSchema();
    const rows = await models.Category.findAll({
      where: { status: 'ACTIVE' },
      attributes: ['id', 'name', 'code', 'status', 'color', 'description', 'updatedAt'],
      order: [['name', 'ASC']],
      limit: 500,
    });
    return rows.map((x) => PublicPortalResponse.toPortalCategory(x));
  };

  getCatalogBootstrap = async (query = {}) => {
    await ensurePublicPortalSchema();
    const products = await this.listProducts(query);
    const categories = await this.listCategories();
    const productTypes = await this.listProductTypes();
    return {
      categories,
      productTypes,
      products,
      meta: {
        categoriesCount: categories.length,
        productTypesCount: productTypes.length,
        productsCount: products.length,
      },
    };
  };

  createReport = async (body = {}) => {
    await ensurePublicPortalSchema();
    const reference = buildReportReference();
    const now = new Date();
    const item = await this.reportRepository.create(null, {
      id: randomUUID(),
      reference,
      reportType: body.reportType,
      stampUid: body.stampUid || null,
      channel: body.channel || null,
      productName: body.productName || null,
      address: body.address || null,
      city: body.city || null,
      region: body.region || null,
      woreda: body.woreda || null,
      latitude: body.latitude ?? null,
      longitude: body.longitude ?? null,
      location: body.location || null,
      comments: body.comments || null,
      photos: Array.isArray(body.photos) ? body.photos : [],
      reporterName: body.reporterName || null,
      reporterContact: body.reporterContact || null,
      reporterId: body.reporterId || null,
      status: REPORT_STATUS.SUBMITTED,
      timeline: [
        {
          status: REPORT_STATUS.SUBMITTED,
          note: 'Report submitted successfully',
          at: now.toISOString(),
        },
      ],
    });

    if (item.reporterId) {
      await this.notificationRepository.create(null, {
        id: randomUUID(),
        reporterId: item.reporterId,
        type: 'REPORT_UPDATE',
        title: 'Report submitted',
        message: `Your report ${reference} has been submitted.`,
        payload: { reference },
        isRead: false,
        createdAt: new Date(),
      });
    }

    return PublicPortalResponse.toReport(item);
  };

  getReportStatus = async (reference) => {
    await ensurePublicPortalSchema();
    const item = await this.reportRepository.findByReference(null, reference);
    if (!item) {
      throw new HttpError(404, 'NOT_FOUND', 'Report not found');
    }
    return PublicPortalResponse.toReport(item);
  };

  listNotifications = async (query = {}) => {
    await ensurePublicPortalSchema();
    const reporterId = String(query.reporterId || '').trim();
    if (!reporterId) {
      return { count: 0, data: [] };
    }
    const rows = await this.notificationRepository.findByReporterId(null, reporterId);
    const data = rows.map((x) => PublicPortalResponse.toNotification(x));
    return { count: data.length, data };
  };

  adminCreateAnnouncement = async (body = {}) => {
    await ensurePublicPortalSchema();
    const title = String(body.title || '').trim();
    const message = String(body.message || '').trim();
    if (!title || !message) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'title and message are required');
    }
    const created = await this.announcementRepository.create(null, {
      id: randomUUID(),
      code: String(body.code || '').trim() || `ANN-${Date.now()}`,
      category: String(body.category || 'AWARENESS').trim().toUpperCase(),
      priority: String(body.priority || 'MEDIUM').trim().toUpperCase(),
      title,
      message,
      isActive: body.isActive !== false,
      publishedAt: new Date(),
    });
    return PublicPortalResponse.toAnnouncement(created);
  };

  adminListReports = async (query = {}) => {
    await ensurePublicPortalSchema();
    const status = String(query.status || '').trim().toUpperCase();
    const rows = await this.reportRepository.findManyByStatus(null, status);
    const data = rows.map((x) => PublicPortalResponse.toReport(x));
    return { count: data.length, data };
  };

  adminUpdateReportStatus = async (reference, body = {}) => {
    await ensurePublicPortalSchema();
    const nextStatus = String(body.status || '').trim().toUpperCase();
    if (!Object.values(REPORT_STATUS).includes(nextStatus)) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'Invalid report status');
    }
    const current = await this.reportRepository.findByReference(null, reference);
    if (!current) {
      throw new HttpError(404, 'NOT_FOUND', 'Report not found');
    }
    const currentPlain = current.get({ plain: true });
    const nextTimeline = Array.isArray(currentPlain.timeline)
      ? [...currentPlain.timeline]
      : [];
    nextTimeline.push({
      status: nextStatus,
      note: String(body.note || '').trim() || null,
      at: new Date().toISOString(),
    });
    await this.reportRepository.update(null, currentPlain.id, {
      status: nextStatus,
      timeline: nextTimeline,
    });
    if (currentPlain.reporterId) {
      await this.notificationRepository.create(null, {
        id: randomUUID(),
        reporterId: currentPlain.reporterId,
        type: 'REPORT_UPDATE',
        title: 'Report status updated',
        message: `Report ${currentPlain.reference} moved to ${nextStatus}.`,
        payload: {
          reference: currentPlain.reference,
          status: nextStatus,
        },
        isRead: false,
        createdAt: new Date(),
      });
    }
    return this.getReportStatus(reference);
  };

  adminCreateNotification = async (body = {}) => {
    await ensurePublicPortalSchema();
    const reporterId = String(body.reporterId || '').trim() || null;
    const type = String(body.type || 'ALERT').trim().toUpperCase();
    const title = String(body.title || '').trim();
    const message = String(body.message || '').trim();
    if (!title || !message) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'title and message are required');
    }
    await this.notificationRepository.create(null, {
      id: randomUUID(),
      reporterId,
      type,
      title,
      message,
      payload: body.payload || {},
      isRead: false,
      createdAt: new Date(),
    });
    if (!reporterId) {
      return { success: true, broadcast: true };
    }
    return { success: true, reporterId };
  };
}
