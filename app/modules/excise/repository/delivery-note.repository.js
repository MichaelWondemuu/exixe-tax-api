import { models } from '../../../shared/db/data-source.js';
import { BaseRepository } from '../../../shared/repository/base.repository.js';

const DELIVERY_NOTE_INCLUDE = [
  {
    model: models.ExciseFacility,
    as: 'fromFacility',
  },
  {
    model: models.ExciseFacility,
    as: 'toFacility',
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
        include: DELIVERY_NOTE_INCLUDE,
        order: [['createdAt', 'DESC']],
      },
      queryParams,
    );
  }

  findByIdDetailed(req, id) {
    return this.findById(req, id, {
      include: DELIVERY_NOTE_INCLUDE,
    });
  }
}
