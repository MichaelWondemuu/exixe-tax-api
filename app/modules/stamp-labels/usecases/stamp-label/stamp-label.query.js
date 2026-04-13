import { Op } from 'sequelize';
import { HttpError } from '../../../../shared/utils/http-error.js';
import {
  STAMP_LABEL_LIFECYCLE_STATUS,
  STAMP_LABEL_VERIFICATION_RESULT,
} from '../../constants/stamp-labels.enums.js';
import { ensureStampLabelSchema } from './stamp-label.schema.js';

export class StampLabelQueryService {
  /**
   * @param {{
   *  stampLabelRepository: import('../../repository/stamp-label.repository.js').StampLabelRepository;
   *  stampLabelEventRepository: import('../../repository/stamp-label.repository.js').StampLabelEventRepository;
   *  stampLabelBatchRepository: import('../../repository/stamp-label.repository.js').StampLabelBatchRepository;
   * }} deps
   */
  constructor({ stampLabelRepository, stampLabelEventRepository, stampLabelBatchRepository }) {
    this.stampLabelRepository = stampLabelRepository;
    this.stampLabelEventRepository = stampLabelEventRepository;
    this.stampLabelBatchRepository = stampLabelBatchRepository;
  }

  list = async (req, query = {}) => {
    await ensureStampLabelSchema();
    return this.stampLabelRepository.findAllDetailed(req, query);
  };

  getById = async (req, id) => {
    await ensureStampLabelSchema();
    const entity = await this.stampLabelRepository.findByIdDetailed(req, id);
    if (!entity) {
      throw new HttpError(404, 'NOT_FOUND', 'Stamp label not found');
    }
    return entity;
  };

  getByUid = async (req, stampUid) => {
    await ensureStampLabelSchema();
    const entity = await this.stampLabelRepository.findByUid(req, stampUid);
    if (!entity) {
      throw new HttpError(404, 'NOT_FOUND', 'Stamp label not found');
    }
    return entity;
  };

  getByBatchNumber = async (req, batchNumber) => {
    await ensureStampLabelSchema();
    const resolvedBatchNumber = String(batchNumber || '').trim();
    if (!resolvedBatchNumber) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'batchNumber is required');
    }

    const [stamps, batch] = await Promise.all([
      this.stampLabelRepository.findManyByBatchNumber(
        req,
        resolvedBatchNumber,
      ),
      this.stampLabelBatchRepository.findByBatchNumber(req, resolvedBatchNumber),
    ]);
    if (!Array.isArray(stamps) || stamps.length === 0) {
      throw new HttpError(404, 'NOT_FOUND', 'No stamp labels found for batchNumber');
    }
    return {
      batchId: batch?.id || null,
      batchNumber: resolvedBatchNumber,
      status: batch?.status || null,
      count: stamps.length,
      stamps,
    };
  };

  getBatchesByStampRequestId = async (req, stampRequestId) => {
    await ensureStampLabelSchema();
    const resolvedStampRequestId = String(stampRequestId || '').trim();
    if (!resolvedStampRequestId) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'stampRequestId is required');
    }

    const stamps = await this.stampLabelRepository.findMany(
      req,
      { stampRequestId: resolvedStampRequestId },
      {
        attributes: ['id', 'stampUid', 'status', 'batchId', 'batchNumber', 'createdAt', 'updatedAt'],
        order: [['createdAt', 'ASC']],
      },
    );

    if (!Array.isArray(stamps) || stamps.length === 0) {
      return {
        stampRequestId: resolvedStampRequestId,
        count: 0,
        batches: [],
      };
    }

    const groups = new Map();
    for (const stamp of stamps) {
      const key = stamp.batchId || stamp.batchNumber || stamp.id;
      const current = groups.get(key) || {
        batchId: stamp.batchId || null,
        batchNumber: stamp.batchNumber || null,
        count: 0,
        statusTracking: {},
      };
      current.count += 1;
      current.statusTracking[stamp.status] = (current.statusTracking[stamp.status] || 0) + 1;
      groups.set(key, current);
    }

    const batchIds = [...new Set(stamps.map((stamp) => stamp.batchId).filter(Boolean))];
    const batchEntities =
      batchIds.length > 0
        ? await this.stampLabelBatchRepository.findMany(
            req,
            { id: { [Op.in]: batchIds } },
            { order: [['updatedAt', 'DESC']] },
          )
        : [];
    const batchMap = new Map(batchEntities.map((batch) => [batch.id, batch]));

    const batches = [...groups.values()]
      .map((group) => {
        const batch = group.batchId ? batchMap.get(group.batchId) : null;
        return {
          batchId: group.batchId,
          batchNumber: group.batchNumber || batch?.batchNumber || null,
          status: batch?.status || null,
          totalCount: batch?.totalCount ?? group.count,
          generatedCount: batch?.generatedCount ?? group.count,
          issuedCount: batch?.issuedCount ?? 0,
          printedCount: batch?.printedCount ?? 0,
          printedAt: batch?.printedAt || null,
          statusTracking: group.statusTracking,
          updatedAt: batch?.updatedAt || null,
        };
      })
      .sort((a, b) => String(b.batchNumber || '').localeCompare(String(a.batchNumber || '')));

    return {
      stampRequestId: resolvedStampRequestId,
      count: batches.length,
      batches,
    };
  };

  getAuditTrail = async (req, id) => {
    await ensureStampLabelSchema();
    const stamp = await this.getById(req, id);
    const events = await this.stampLabelEventRepository.listByStampLabelId(req, id);
    return {
      stamp,
      events: events.data || [],
      count: events.count ?? 0,
    };
  };

  getBatchAuditTrail = async (req, batchNumber) => {
    await ensureStampLabelSchema();
    const resolvedBatchNumber = String(batchNumber || '').trim();
    if (!resolvedBatchNumber) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'batchNumber is required');
    }

    const stamps = await this.stampLabelRepository.findManyByBatchNumber(
      req,
      resolvedBatchNumber,
    );
    if (!Array.isArray(stamps) || stamps.length === 0) {
      throw new HttpError(404, 'NOT_FOUND', 'No stamp labels found for batchNumber');
    }

    const stampIds = stamps.map((stamp) => stamp.id);
    const events = await this.stampLabelEventRepository.listByStampLabelIds(req, stampIds);
    return {
      batchNumber: resolvedBatchNumber,
      stamps,
      events: events.data || [],
      count: events.count ?? 0,
    };
  };

  getBatchesAuditByStampRequestId = async (req, stampRequestId) => {
    await ensureStampLabelSchema();
    const resolvedStampRequestId = String(stampRequestId || '').trim();
    if (!resolvedStampRequestId) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'stampRequestId is required');
    }

    const stamps = await this.stampLabelRepository.findMany(
      req,
      { stampRequestId: resolvedStampRequestId },
      {
        attributes: [
          'id',
          'stampUid',
          'status',
          'batchId',
          'batchNumber',
          'generatedAt',
          'issuedAt',
          'auditedAt',
          'revokedAt',
          'updatedAt',
        ],
        order: [['createdAt', 'ASC']],
      },
    );

    if (!Array.isArray(stamps) || stamps.length === 0) {
      return {
        stampRequestId: resolvedStampRequestId,
        count: 0,
        batches: [],
      };
    }

    const stampIds = stamps.map((stamp) => stamp.id);
    const events = await this.stampLabelEventRepository.listByStampLabelIds(req, stampIds);
    const eventRows = events.data || [];

    const groups = new Map();
    for (const stamp of stamps) {
      const key = stamp.batchId || stamp.batchNumber || stamp.id;
      const current = groups.get(key) || {
        batchId: stamp.batchId || null,
        batchNumber: stamp.batchNumber || null,
        stamps: [],
        statusTracking: {},
        events: [],
      };
      current.stamps.push(stamp);
      current.statusTracking[stamp.status] = (current.statusTracking[stamp.status] || 0) + 1;
      groups.set(key, current);
    }

    const stampIdToBatchKey = new Map();
    for (const [key, group] of groups.entries()) {
      for (const stamp of group.stamps) {
        stampIdToBatchKey.set(stamp.id, key);
      }
    }

    for (const event of eventRows) {
      const key = stampIdToBatchKey.get(event.stampLabelId);
      if (!key) continue;
      const group = groups.get(key);
      if (!group) continue;
      group.events.push(event);
    }

    const batchIds = [...new Set(stamps.map((stamp) => stamp.batchId).filter(Boolean))];
    const batchEntities =
      batchIds.length > 0
        ? await this.stampLabelBatchRepository.findMany(
            req,
            { id: { [Op.in]: batchIds } },
            { order: [['updatedAt', 'DESC']] },
          )
        : [];
    const batchMap = new Map(batchEntities.map((batch) => [batch.id, batch]));

    const batches = [...groups.values()]
      .map((group) => {
        const batch = group.batchId ? batchMap.get(group.batchId) : null;
        return {
          batchId: group.batchId,
          batchNumber: group.batchNumber || batch?.batchNumber || null,
          status: batch?.status || null,
          totalCount: batch?.totalCount ?? group.stamps.length,
          generatedCount: batch?.generatedCount ?? group.stamps.length,
          issuedCount: batch?.issuedCount ?? 0,
          printedCount: batch?.printedCount ?? 0,
          printedAt: batch?.printedAt || null,
          statusTracking: group.statusTracking,
          stamps: group.stamps,
          events: group.events,
          eventCount: group.events.length,
          updatedAt: batch?.updatedAt || null,
        };
      })
      .sort((a, b) => String(b.batchNumber || '').localeCompare(String(a.batchNumber || '')));

    return {
      stampRequestId: resolvedStampRequestId,
      count: batches.length,
      batches,
    };
  };

  getSummary = async (req) => {
    await ensureStampLabelSchema();
    const Model = this.stampLabelRepository.getModel();
    const EventModel = this.stampLabelEventRepository.getModel();
    const [
      generated,
      issued,
      assigned,
      applied,
      activated,
      tracked,
      verified,
      audited,
      revoked,
      suspectCount,
      notFoundVerifications,
    ] = await Promise.all([
      Model.count({ where: { status: STAMP_LABEL_LIFECYCLE_STATUS.GENERATED } }),
      Model.count({ where: { status: STAMP_LABEL_LIFECYCLE_STATUS.ISSUED } }),
      Model.count({ where: { status: STAMP_LABEL_LIFECYCLE_STATUS.ASSIGNED } }),
      Model.count({ where: { status: STAMP_LABEL_LIFECYCLE_STATUS.APPLIED } }),
      Model.count({ where: { status: STAMP_LABEL_LIFECYCLE_STATUS.ACTIVATED } }),
      Model.count({ where: { status: STAMP_LABEL_LIFECYCLE_STATUS.TRACKED } }),
      Model.count({ where: { status: STAMP_LABEL_LIFECYCLE_STATUS.VERIFIED } }),
      Model.count({ where: { status: STAMP_LABEL_LIFECYCLE_STATUS.AUDITED } }),
      Model.count({ where: { status: STAMP_LABEL_LIFECYCLE_STATUS.REVOKED } }),
      EventModel.count({
        where: {
          verificationResult: {
            [Op.in]: [
              STAMP_LABEL_VERIFICATION_RESULT.SUSPECT,
              STAMP_LABEL_VERIFICATION_RESULT.CANCELLED_UI,
            ],
          },
        },
      }),
      EventModel.count({
        where: { verificationResult: STAMP_LABEL_VERIFICATION_RESULT.NOT_FOUND },
      }),
    ]);

    const total =
      generated +
      issued +
      assigned +
      applied +
      activated +
      tracked +
      verified +
      audited +
      revoked;

    return {
      totals: {
        total,
        generated,
        issued,
        assigned,
        applied,
        activated,
        tracked,
        verified,
        audited,
        revoked,
      },
      enforcement: {
        suspectCount,
        notFoundVerifications,
      },
    };
  };

  listBatches = async (req, query = {}) => {
    await ensureStampLabelSchema();
    return this.stampLabelBatchRepository.findAll(req, { order: [['updatedAt', 'DESC']] }, query);
  };

  getBatchById = async (req, id) => {
    await ensureStampLabelSchema();
    const batch = await this.stampLabelBatchRepository.findByIdDetailed(req, id);
    if (!batch) {
      throw new HttpError(404, 'NOT_FOUND', 'Batch not found');
    }
    return batch;
  };

  getBatchByNumber = async (req, batchNumber) => {
    await ensureStampLabelSchema();
    const normalizedBatchNumber = String(batchNumber || '').trim();
    if (!normalizedBatchNumber) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'batchNumber is required');
    }
    const batch = await this.stampLabelBatchRepository.findByBatchNumber(req, normalizedBatchNumber);
    if (!batch) {
      throw new HttpError(404, 'NOT_FOUND', 'Batch not found');
    }
    return this.stampLabelBatchRepository.findByIdDetailed(req, batch.id);
  };

}
