import { DataResponseFormat } from '../../../shared/utils/response-formatter.js';
import { models } from '../../../shared/db/data-source.js';
import { getUser } from '../../auth/middleware/user-context.js';

export class CounterfeitCaseQueryService {
  /**
   * @param {import('express').Request} req
   * @param {Record<string, unknown>} queryParams
   */
  list = async (req, queryParams = {}) => {
    const user = getUser(req);
    const limit = Math.min(
      Number(queryParams.limit ?? queryParams.page_size ?? 50) || 50,
      200,
    );
    const offset = Number(queryParams.offset ?? 0) || 0;

    const where = {};
    if (!user?.isSystem) {
      where.createdByUserId = user.userId;
    }

    const { count, rows } = await models.CounterfeitCase.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit,
      offset,
      include: [
        { association: 'createdBy', required: false, attributes: { exclude: ['pinHash'] } },
        { association: 'assignedTo', required: false, attributes: { exclude: ['pinHash'] } },
      ],
    });

    return DataResponseFormat.from(rows, count);
  };

  /**
   * @param {import('express').Request} req
   * @param {string} id
   */
  getById = async (req, id) => {
    const user = getUser(req);
    const where = { id };
    if (!user?.isSystem) {
      where.createdByUserId = user.userId;
    }

    return models.CounterfeitCase.findOne({
      where,
      include: [
        { association: 'createdBy', required: false, attributes: { exclude: ['pinHash'] } },
        { association: 'assignedTo', required: false, attributes: { exclude: ['pinHash'] } },
        { association: 'subjectOrganization', required: false },
        { association: 'sourceReport', required: false },
        { association: 'stampVerifications', required: false },
      ],
    });
  };
}
