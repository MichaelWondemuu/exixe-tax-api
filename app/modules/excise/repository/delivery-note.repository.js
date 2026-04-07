import { models } from '../../../shared/db/data-source.js';
import { BaseRepository } from '../../../shared/repository/base.repository.js';

const DELIVERY_NOTE_ATTRIBUTES = [
  'id',
  'noteNumber',
  'organizationId',
  'fromFacilityId',
  'toFacilityId',
  'shipmentRoute',
  'transporterName',
  'vehiclePlateNo',
  'expectedDispatchAt',
  'expectedArrivalAt',
  'status',
  'items',
  'remarks',
  'approvedAt',
  'dispatchedAt',
  'receivedAt',
  'createdAt',
  'updatedAt',
];

const DELIVERY_NOTE_INCLUDE = [
  {
    model: models.ExciseFacility,
    as: 'fromFacility',
    attributes: ['id', 'code', 'name', 'facilityType'],
  },
  {
    model: models.ExciseFacility,
    as: 'toFacility',
    attributes: ['id', 'code', 'name', 'facilityType'],
  },
];

export class ExciseDeliveryNoteRepository extends BaseRepository {
  constructor() {
    super({ Model: models.ExciseDeliveryNote });
  }

  findAllDetailed(req, queryParams = {}) {
    return this.findAll(
      req,
      {
        attributes: DELIVERY_NOTE_ATTRIBUTES,
        include: DELIVERY_NOTE_INCLUDE,
        order: [['createdAt', 'DESC']],
      },
      queryParams,
    );
  }

  findByIdDetailed(req, id) {
    return this.findById(req, id, {
      attributes: DELIVERY_NOTE_ATTRIBUTES,
      include: DELIVERY_NOTE_INCLUDE,
    });
  }
}
