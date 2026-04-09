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
   * }} deps
   */
  constructor({ stampLabelRepository, stampLabelEventRepository }) {
    this.stampLabelRepository = stampLabelRepository;
    this.stampLabelEventRepository = stampLabelEventRepository;
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
}
