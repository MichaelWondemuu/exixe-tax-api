import { DataResponseFormat } from '../../../shared/utils/response-formatter.js';
import { models } from '../../../shared/db/data-source.js';

export class ReconciliationQueryService {
  listRuns = async (_req, queryParams = {}) => {
    const limit = Math.min(
      Number(queryParams.limit ?? queryParams.page_size ?? 50) || 50,
      200,
    );
    const offset = Number(queryParams.offset ?? 0) || 0;

    const where = {};
    if (queryParams.organizationId) where.organizationId = queryParams.organizationId;
    if (queryParams.facilityId) where.facilityId = queryParams.facilityId;

    const { count, rows } = await models.ReconciliationRun.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit,
      offset,
      include: [
        { association: 'organization', required: false },
        { association: 'facility', required: false },
        {
          association: 'createdBy',
          required: false,
          attributes: { exclude: ['pinHash'] },
        },
      ],
    });
    return DataResponseFormat.from(rows, count);
  };

  getRunById = async (_req, id) =>
    models.ReconciliationRun.findByPk(id, {
      include: [
        { association: 'organization', required: false },
        { association: 'facility', required: false },
        {
          association: 'createdBy',
          required: false,
          attributes: { exclude: ['pinHash'] },
        },
      ],
    });

  listRunItems = async (_req, runId, queryParams = {}) => {
    const limit = Math.min(Number(queryParams.limit ?? 100) || 100, 200);
    const offset = Number(queryParams.offset ?? 0) || 0;

    const where = { reconciliationRunId: runId };
    if (queryParams.severity) where.severity = queryParams.severity;
    if (queryParams.productId) where.productId = queryParams.productId;
    if (queryParams.facilityId) where.facilityId = queryParams.facilityId;

    const { count, rows } = await models.ReconciliationItem.findAndCountAll({
      where,
      order: [
        ['severity', 'DESC'],
        ['variance_percent', 'DESC'],
      ],
      limit,
      offset,
      include: [
        { association: 'facility', required: false },
        { association: 'product', required: false },
        { association: 'productVariant', required: false },
      ],
    });

    return DataResponseFormat.from(rows, count);
  };
}
