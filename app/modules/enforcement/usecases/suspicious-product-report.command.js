import { models } from '../../../shared/db/data-source.js';
import { HttpError } from '../../../shared/utils/http-error.js';
import { getUser } from '../../auth/middleware/user-context.js';
import { SUSPICIOUS_PRODUCT_REPORT_STATUS } from '../constants/enforcement.enums.js';

export class SuspiciousProductReportCommandService {
  constructor({ suspiciousProductReportRepository }) {
    this.suspiciousProductReportRepository = suspiciousProductReportRepository;
  }

  /**
   * Authenticated submission; separate from counterfeit reports.
   * @param {import('express').Request} req
   * @param {Record<string, unknown>} body
   */
  create = async (req, body) => {
    const user = getUser(req);
    if (!user?.userId) {
      throw new HttpError(401, 'UNAUTHORIZED', 'Authentication required');
    }

    const product = await models.Product.findByPk(body.productId, {
      attributes: ['id'],
    });
    if (!product) {
      throw new HttpError(404, 'NOT_FOUND', 'productId not found');
    }

    return models.SuspiciousProductReport.create({
      reportedByUserId: user.userId,
      productId: body.productId,
      description: body.description,
      subjectOrganizationId: body.subjectOrganizationId ?? null,
      reporterName: body.reporterName ?? null,
      reporterEmail: body.reporterEmail ?? null,
      reporterPhone: body.reporterPhone ?? null,
      facilityId: body.facilityId ?? null,
      stampIdentifier: body.stampIdentifier ?? null,
      evidence: body.evidence ?? null,
      status: SUSPICIOUS_PRODUCT_REPORT_STATUS.SUBMITTED,
    });
  };

  /**
   * @param {import('express').Request} req
   * @param {string} id
   * @param {{ status: string }} body
   */
  updateStatus = async (req, id, body) => {
    const row = await this.suspiciousProductReportRepository.findById(req, id);
    if (!row) {
      return null;
    }
    await row.update({ status: body.status });
    return this.suspiciousProductReportRepository.findById(req, id);
  };
}
