import { Op } from 'sequelize';
import { models } from '../../../shared/db/data-source.js';
import { applyScopeFilters } from '../../../shared/repository/scope-filtering.js';
import { PRODUCT_RECALL_STATUS } from '../constants/enforcement.enums.js';

function normLot(s) {
  if (s == null || String(s).trim() === '') {
    return null;
  }
  return String(s).trim().toLowerCase();
}

/**
 * Whether a published recall applies to the given variant/lot filters (defensive matching).
 * @param {import('sequelize').Model} recall
 * @param {{ productVariantId?: string | null; lotOrBatchCode?: string | null }} query
 */
export function recallMatchesConsumerQuery(recall, query) {
  const qv = query.productVariantId || null;
  const ql = normLot(query.lotOrBatchCode);

  if (recall.productVariantId && qv && recall.productVariantId !== qv) {
    return false;
  }

  const recallLot = normLot(recall.lotOrBatchCode);
  if (recallLot && ql && recallLot !== ql) {
    return false;
  }

  return true;
}

export class ProductRecallQueryService {
  constructor({ productRecallRepository }) {
    this.productRecallRepository = productRecallRepository;
  }

  listAdmin = async (req, queryParams = {}) => {
    const limit = Math.min(
      Number(queryParams.limit ?? queryParams.page_size ?? 50) || 50,
      200,
    );
    const offset = Number(queryParams.offset ?? 0) || 0;

    const where = {};
    if (queryParams.status) {
      where.status = queryParams.status;
    }
    if (queryParams.productId) {
      where.productId = queryParams.productId;
    }

    const scoped = await applyScopeFilters(
      req,
      {
        where,
        order: [['created_at', 'DESC']],
      },
      this.productRecallRepository.Model,
    );

    return this.productRecallRepository.findAll(req, scoped, {
      ...queryParams,
      limit,
      offset,
    });
  };

  getByIdAdmin = async (req, id) =>
    this.productRecallRepository.findById(req, id, {
      include: [
        { association: 'product', required: false },
        { association: 'productVariant', required: false },
        { association: 'initiatedBy', required: false, attributes: { exclude: ['pinHash'] } },
        { association: 'subjectOrganization', required: false },
      ],
    });

  /**
   * Active published recalls for a product, optionally narrowed by variant/lot.
   * @param {import('express').Request} req
   * @param {{ productId: string; productVariantId?: string | null; lotOrBatchCode?: string | null }} query
   */
  listActiveForProduct = async (req, query) => {
    const now = new Date();
    const { productId, productVariantId, lotOrBatchCode } = query;

    const rows = await models.ProductRecall.findAll({
      where: {
        productId,
        status: PRODUCT_RECALL_STATUS.PUBLISHED,
        [Op.and]: [
          {
            [Op.or]: [
              { effectiveFrom: null },
              { effectiveFrom: { [Op.lte]: now } },
            ],
          },
          {
            [Op.or]: [
              { effectiveTo: null },
              { effectiveTo: { [Op.gte]: now } },
            ],
          },
        ],
      },
      order: [['published_at', 'DESC']],
      include: [
        { association: 'product', required: false },
        { association: 'productVariant', required: false },
        { association: 'subjectOrganization', required: false },
      ],
    });

    const filtered = rows.filter((r) =>
      recallMatchesConsumerQuery(r, { productVariantId, lotOrBatchCode }),
    );

    return { data: filtered, count: filtered.length };
  };
}
