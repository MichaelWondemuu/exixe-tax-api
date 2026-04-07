import { models } from '../../../shared/db/data-source.js';
import { BaseRepository } from '../../../shared/repository/base.repository.js';

const VERIFICATION_ATTRIBUTES = [
  'id',
  'verificationNumber',
  'organizationId',
  'facilityId',
  'actorType',
  'channel',
  'result',
  'stampIdentifier',
  'productDescription',
  'supplierName',
  'supplierDocumentType',
  'supplierDocumentNumber',
  'verificationEvidence',
  'remarks',
  'verifiedAt',
  'createdAt',
  'updatedAt',
];

const VERIFICATION_INCLUDE = [
  {
    model: models.ExciseFacility,
    as: 'facility',
    attributes: ['id', 'code', 'name', 'facilityType'],
  },
];

export class ExciseStampVerificationRepository extends BaseRepository {
  constructor() {
    super({ Model: models.ExciseStampVerification });
  }

  findAllDetailed(req, queryParams = {}) {
    return this.findAll(
      req,
      {
        attributes: VERIFICATION_ATTRIBUTES,
        include: VERIFICATION_INCLUDE,
        order: [['verifiedAt', 'DESC']],
      },
      queryParams,
    );
  }

  findByIdDetailed(req, id) {
    return this.findById(req, id, {
      attributes: VERIFICATION_ATTRIBUTES,
      include: VERIFICATION_INCLUDE,
    });
  }
}
