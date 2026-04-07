import { models } from '../../../shared/db/data-source.js';
import { BaseRepository } from '../../../shared/repository/base.repository.js';

const FACILITY_ATTRIBUTES = [
  'id',
  'code',
  'organizationId',
  'name',
  'facilityType',
  'licenseNumber',
  'region',
  'zone',
  'woreda',
  'city',
  'addressLine1',
  'addressLine2',
  'isActive',
  'createdAt',
  'updatedAt',
];

export class ExciseFacilityRepository extends BaseRepository {
  constructor() {
    super({ Model: models.ExciseFacility });
  }

  findAllDetailed(req, queryParams = {}) {
    return this.findAll(
      req,
      {
        attributes: FACILITY_ATTRIBUTES,
        order: [['createdAt', 'DESC']],
      },
      queryParams,
    );
  }

  findByIdDetailed(req, id) {
    return this.findById(req, id, {
      attributes: FACILITY_ATTRIBUTES,
    });
  }
}
