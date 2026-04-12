import { Op } from 'sequelize';
import { sequelize } from '../../../shared/db/database.js';
import { models } from '../../../shared/db/data-source.js';
import { HttpError } from '../../../shared/utils/http-error.js';
import { getUser } from '../../auth/middleware/user-context.js';

export class CounterfeitCaseCommandService {
  constructor({ counterfeitCaseQueryService }) {
    this.counterfeitCaseQueryService = counterfeitCaseQueryService;
  }

  /**
   * Manual case creation only (no automation from stamp verification).
   * @param {import('express').Request} req
   * @param {{
   *   title: string;
   *   description?: string | null;
   *   subjectOrganizationId?: string | null;
   *   sourceCounterfeitReportId?: string | null;
   *   stampVerificationIds?: string[];
   * }} body
   */
  create = async (req, body) => {
    const user = getUser(req);
    if (!user?.userId) {
      throw new HttpError(401, 'UNAUTHORIZED', 'Authentication required');
    }

    if (body.sourceCounterfeitReportId) {
      const report = await models.CounterfeitReport.findByPk(
        body.sourceCounterfeitReportId,
      );
      if (!report) {
        throw new HttpError(
          404,
          'NOT_FOUND',
          'Source counterfeit report not found',
        );
      }
    }

    const ids = body.stampVerificationIds ?? [];
    if (ids.length > 0) {
      const found = await models.ExciseStampVerification.count({
        where: { id: { [Op.in]: ids } },
      });
      if (found !== ids.length) {
        throw new HttpError(
          400,
          'INVALID_STAMP_VERIFICATION',
          'One or more stamp verification IDs are invalid',
        );
      }
    }

    const transaction = await sequelize.transaction();
    try {
      const caseRow = await models.CounterfeitCase.create(
        {
          title: body.title,
          description: body.description ?? null,
          subjectOrganizationId: body.subjectOrganizationId ?? null,
          sourceCounterfeitReportId: body.sourceCounterfeitReportId ?? null,
          createdByUserId: user.userId,
        },
        { transaction },
      );

      if (ids.length > 0) {
        await models.CounterfeitCaseStampVerification.bulkCreate(
          ids.map((exciseStampVerificationId) => ({
            counterfeitCaseId: caseRow.id,
            exciseStampVerificationId,
          })),
          { transaction },
        );
      }

      await transaction.commit();
      return this.counterfeitCaseQueryService.getById(req, caseRow.id);
    } catch (e) {
      await transaction.rollback();
      throw e;
    }
  };

  /**
   * @param {import('express').Request} req
   * @param {string} id
   * @param {Record<string, unknown>} body
   */
  patch = async (req, id, body) => {
    const user = getUser(req);
    const row = await models.CounterfeitCase.findByPk(id);
    if (!row) {
      return null;
    }
    if (!user?.isSystem && row.createdByUserId !== user?.userId) {
      throw new HttpError(403, 'FORBIDDEN', 'You cannot update this case');
    }

    const patch = {};
    if (body.title !== undefined) patch.title = body.title;
    if (body.description !== undefined) patch.description = body.description;
    if (body.status !== undefined) patch.status = body.status;
    if (body.assignedToUserId !== undefined) {
      patch.assignedToUserId = body.assignedToUserId;
    }
    if (body.subjectOrganizationId !== undefined) {
      patch.subjectOrganizationId = body.subjectOrganizationId;
    }

    await row.update(patch);
    return this.counterfeitCaseQueryService.getById(req, id);
  };
}
