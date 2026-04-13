import { DataResponseFormat } from '../../../shared/utils/response-formatter.js';
import { models } from '../../../shared/db/data-source.js';
import { getUser } from '../../auth/middleware/user-context.js';

export class StockSnapshotQueryService {
  list = async (req, queryParams = {}) => {
    const user = getUser(req);
    const limit = Math.min(
      Number(queryParams.limit ?? queryParams.page_size ?? 50) || 50,
      200,
    );
    const offset = Number(queryParams.offset ?? 0) || 0;

    const where = {};
    if (!user?.isSystem) {
      where.organizationId = user?.organization?.id ?? null;
    } else if (queryParams.organizationId) {
      where.organizationId = queryParams.organizationId;
    }
    if (queryParams.productId) where.productId = queryParams.productId;
    if (queryParams.facilityId) where.facilityId = queryParams.facilityId;

    const { count, rows } = await models.StockSnapshot.findAndCountAll({
      where,
      order: [['counted_at', 'DESC']],
      limit,
      offset,
      include: [
        { association: 'organization', required: false },
        { association: 'facility', required: false },
        { association: 'product', required: false },
        { association: 'productVariant', required: false },
        {
          association: 'reportedBy',
          required: false,
          attributes: { exclude: ['pinHash'] },
        },
      ],
    });

    return DataResponseFormat.from(rows, count);
  };

  getById = async (req, id) => {
    const user = getUser(req);
    const where = { id };
    if (!user?.isSystem) {
      where.organizationId = user?.organization?.id ?? null;
    }

    return models.StockSnapshot.findOne({
      where,
      include: [
        { association: 'organization', required: false },
        { association: 'facility', required: false },
        { association: 'product', required: false },
        { association: 'productVariant', required: false },
        {
          association: 'reportedBy',
          required: false,
          attributes: { exclude: ['pinHash'] },
        },
      ],
    });
  };
}
