import { models } from '../../../shared/db/data-source.js';
import { BaseRepository } from '../../../shared/repository/base.repository.js';

export class ZoneRepository extends BaseRepository {
  constructor() {
    super({ Model: models.Zone });
  }

  destroyAllForce(transaction) {
    return this.Model.destroy({ where: {}, force: true, transaction });
  }

  bulkCreate(rows, options = {}) {
    if (!rows.length) return Promise.resolve([]);
    return this.Model.bulkCreate(rows, options);
  }

  maxId() {
    return this.Model.max('id');
  }

  findByRegionId(regionId) {
    return this.Model.findAll({
      where: { region_id: regionId },
      order: [['id', 'ASC']],
      attributes: ['id', 'region_id', 'code', 'description', 'description_amh'],
    });
  }
}
