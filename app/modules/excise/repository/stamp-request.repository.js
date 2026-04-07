import { models } from '../../../shared/db/data-source.js';
import { BaseRepository } from '../../../shared/repository/base.repository.js';

const STAMP_REQUEST_ATTRIBUTES = [
  'id',
  'requestNumber',
  'organizationId',
  'facilityId',
  'goodsCategory',
  'goodsDescription',
  'quantity',
  'stampFeeAmount',
  'stampFeeCurrency',
  'paymentStatus',
  'paymentReference',
  'paymentProofUrl',
  'paidAt',
  'requiredByDate',
  'plannedProductionOrImportDate',
  'status',
  'attachmentUrl',
  'rejectionReason',
  'submittedAt',
  'reviewDueAt',
  'reviewedAt',
  'reviewedByUserId',
  'reviewSlaBreached',
  'approvedAt',
  'fulfilledAt',
  'createdAt',
  'updatedAt',
];

const STAMP_REQUEST_INCLUDE = [
  {
    model: models.ExciseFacility,
    as: 'facility',
    attributes: ['id', 'code', 'name', 'facilityType'],
  },
];

export class ExciseStampRequestRepository extends BaseRepository {
  constructor() {
    super({ Model: models.ExciseStampRequest });
  }

  findAllDetailed(req, queryParams = {}) {
    return this.findAll(
      req,
      {
        attributes: STAMP_REQUEST_ATTRIBUTES,
        include: STAMP_REQUEST_INCLUDE,
        order: [['createdAt', 'DESC']],
      },
      queryParams,
    );
  }

  findByIdDetailed(req, id) {
    return this.findById(req, id, {
      attributes: STAMP_REQUEST_ATTRIBUTES,
      include: STAMP_REQUEST_INCLUDE,
    });
  }
}
