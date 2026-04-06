import { models } from '../../../shared/db/data-source.js';
import { BaseRepository } from '../../../shared/repository/base.repository.js';

export class RegionRepository extends BaseRepository {
  constructor() {
    super({ Model: models.Region });
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

  findAllOrdered() {
    return this.Model.findAll({
      order: [['id', 'ASC']],
      attributes: ['id', 'code', 'description', 'region_type', 'description_amh'],
    });
  }
}
