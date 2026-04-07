import { models } from '../../../shared/db/data-source.js';
import { BaseRepository } from '../../../shared/repository/base.repository.js';

export class MeasurementRepository extends BaseRepository {
  constructor() {
    super({ Model: models.Measurement });
  }

  findAllListed() {
    return this.Model.findAll({
      attributes: ['id', 'name', 'shortForm', 'createdAt', 'updatedAt'],
      order: [['name', 'ASC']],
    });
  }

  findByPkListed(id) {
    return this.Model.findByPk(id, {
      attributes: ['id', 'name', 'shortForm', 'createdAt', 'updatedAt'],
    });
  }

  findByName(name) {
    return this.Model.findOne({
      where: { name },
      attributes: ['id', 'name', 'shortForm', 'createdAt', 'updatedAt'],
    });
  }

  findByShortForm(shortForm) {
    return this.Model.findOne({
      where: { shortForm },
      attributes: ['id', 'name', 'shortForm', 'createdAt', 'updatedAt'],
    });
  }
}
