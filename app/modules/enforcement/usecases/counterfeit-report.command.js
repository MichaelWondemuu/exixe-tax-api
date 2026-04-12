import { models } from '../../../shared/db/data-source.js';
import { HttpError } from '../../../shared/utils/http-error.js';
import { getUser } from '../../auth/middleware/user-context.js';
import { COUNTERFEIT_REPORT_STATUS } from '../constants/enforcement.enums.js';

export class CounterfeitReportCommandService {
  constructor({ counterfeitReportRepository }) {
    this.counterfeitReportRepository = counterfeitReportRepository;
  }

  /**
   * Authenticated submission; does not create an enforcement case.
   * @param {import('express').Request} req
   * @param {Record<string, unknown>} body
   */
  create = async (req, body) => {
    const user = getUser(req);
    if (!user?.userId) {
      throw new HttpError(401, 'UNAUTHORIZED', 'Authentication required');
    }

    return models.CounterfeitReport.create({
      reportedByUserId: user.userId,
      description: body.description,
      subjectOrganizationId: body.subjectOrganizationId ?? null,
      reporterName: body.reporterName ?? null,
      reporterEmail: body.reporterEmail ?? null,
      reporterPhone: body.reporterPhone ?? null,
      facilityId: body.facilityId ?? null,
      productId: body.productId ?? null,
      stampIdentifier: body.stampIdentifier ?? null,
      evidence: body.evidence ?? null,
      status: COUNTERFEIT_REPORT_STATUS.SUBMITTED,
    });
  };

  /**
   * @param {import('express').Request} req
   * @param {string} id
   * @param {{ status: string }} body
   */
  updateStatus = async (req, id, body) => {
    const row = await this.counterfeitReportRepository.findById(req, id);
    if (!row) {
      return null;
    }
    await row.update({ status: body.status });
    return this.counterfeitReportRepository.findById(req, id);
  };
}
