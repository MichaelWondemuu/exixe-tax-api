import { models } from '../../../shared/db/data-source.js';
import { BaseRepository } from '../../../shared/repository/base.repository.js';

export class VerificationBodyRepository extends BaseRepository {
  constructor() {
    super({ Model: models.VerificationBody });
  }

  findAllListed() {
    return this.Model.findAll({
      attributes: ['id', 'name', 'createdAt', 'updatedAt'],
      order: [['name', 'ASC']],
    });
  }

  findByPkListed(id) {
    return this.Model.findByPk(id, {
      attributes: ['id', 'name', 'createdAt', 'updatedAt'],
    });
  }

  async findOrCreateByName(name, transaction) {
    let row = await this.Model.findOne({ where: { name }, transaction });
    if (!row) {
      row = await this.Model.create({ name }, { transaction });
    }
    return row;
  }
}
