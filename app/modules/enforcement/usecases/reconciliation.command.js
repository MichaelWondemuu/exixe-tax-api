import { Op } from 'sequelize';
import { sequelize } from '../../../shared/db/database.js';
import { models } from '../../../shared/db/data-source.js';
import { HttpError } from '../../../shared/utils/http-error.js';
import { getUser } from '../../auth/middleware/user-context.js';
import {
  RECONCILIATION_ITEM_SEVERITY,
  RECONCILIATION_RUN_STATUS,
} from '../constants/enforcement.enums.js';

const toFixedNum = (n, digits = 3) => Number(Number(n || 0).toFixed(digits));
const keyOf = (x) =>
  `${x.organizationId}|${x.facilityId}|${x.productId}|${x.productVariantId || ''}|${(x.lotOrBatchCode || '').trim().toLowerCase()}`;

function severityFromVariancePercent(percent) {
  const abs = Math.abs(percent ?? 0);
  if (abs <= 2) return RECONCILIATION_ITEM_SEVERITY.LOW;
  if (abs <= 5) return RECONCILIATION_ITEM_SEVERITY.MEDIUM;
  if (abs <= 10) return RECONCILIATION_ITEM_SEVERITY.HIGH;
  return RECONCILIATION_ITEM_SEVERITY.CRITICAL;
}

export class ReconciliationCommandService {
  createRun = async (_req, body) => {
    const user = getUser(_req);
    if (!user?.userId || !user?.isSystem) {
      throw new HttpError(403, 'FORBIDDEN', 'System user required');
    }

    const periodStart = new Date(body.periodStart);
    const periodEnd = new Date(body.periodEnd);
    if (periodStart.getTime() > periodEnd.getTime()) {
      throw new HttpError(
        400,
        'VALIDATION_ERROR',
        'periodStart must be before or equal to periodEnd',
      );
    }

    const whereScope = { organizationId: body.organizationId };
    if (body.facilityId) whereScope.facilityId = body.facilityId;

    const [productions, snapshots] = await Promise.all([
      models.ProductionRecord.findAll({
        where: {
          ...whereScope,
          producedAt: { [Op.between]: [periodStart, periodEnd] },
        },
      }),
      models.StockSnapshot.findAll({
        where: {
          ...whereScope,
          countedAt: { [Op.lte]: periodEnd },
        },
        order: [['counted_at', 'DESC']],
      }),
    ]);

    const producedMap = new Map();
    for (const row of productions) {
      const key = keyOf(row);
      const prev = producedMap.get(key) || 0;
      producedMap.set(key, prev + Number(row.actualProducedQty || 0));
    }

    const latestStockMap = new Map();
    for (const row of snapshots) {
      const key = keyOf(row);
      if (!latestStockMap.has(key)) {
        latestStockMap.set(key, row);
      }
    }

    const keys = new Set([
      ...Array.from(producedMap.keys()),
      ...Array.from(latestStockMap.keys()),
    ]);

    const tx = await sequelize.transaction();
    try {
      const run = await models.ReconciliationRun.create(
        {
          runNumber: `REC-${Date.now()}`,
          organizationId: body.organizationId,
          facilityId: body.facilityId ?? null,
          periodStart,
          periodEnd,
          status: RECONCILIATION_RUN_STATUS.COMPLETED,
          createdByUserId: user.userId,
        },
        { transaction: tx },
      );

      const items = [];
      let totalVarianceQty = 0;
      for (const key of keys) {
        const stockRow = latestStockMap.get(key);
        const [organizationId, facilityId, productId, productVariantId, lot] =
          key.split('|');
        const producedQty = toFixedNum(producedMap.get(key) || 0, 3);
        const onHandQty = toFixedNum(stockRow?.quantityOnHand || 0, 3);
        const varianceQty = toFixedNum(producedQty - onHandQty, 3);
        const variancePercent =
          producedQty === 0 ? null : toFixedNum((varianceQty / producedQty) * 100, 2);
        totalVarianceQty += varianceQty;

        items.push({
          reconciliationRunId: run.id,
          organizationId,
          facilityId,
          productId,
          productVariantId: productVariantId || null,
          lotOrBatchCode: lot || null,
          actualProducedQty: producedQty,
          quantityOnHand: onHandQty,
          varianceQty,
          variancePercent,
          severity: severityFromVariancePercent(variancePercent ?? 0),
        });
      }

      if (items.length > 0) {
        await models.ReconciliationItem.bulkCreate(items, { transaction: tx });
      }

      await run.update(
        {
          totalItems: items.length,
          totalVarianceQty: toFixedNum(totalVarianceQty, 3),
        },
        { transaction: tx },
      );

      await tx.commit();
      return models.ReconciliationRun.findByPk(run.id, {
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
    } catch (error) {
      await tx.rollback();
      throw error;
    }
  };
}
