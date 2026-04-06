import { models } from '../../../shared/db/data-source.js';
import { BaseRepository } from '../../../shared/repository/base.repository.js';

export class WoredaRepository extends BaseRepository {
  constructor() {
    super({ Model: models.Woreda });
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

  findByZoneId(zoneId) {
    return this.Model.findAll({
      where: { zone_id: zoneId },
      order: [['id', 'ASC']],
      attributes: ['id', 'zone_id', 'code', 'description', 'description_amh'],
    });
  }
}
