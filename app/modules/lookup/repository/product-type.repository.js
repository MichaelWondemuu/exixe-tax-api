import { models } from '../../../shared/db/data-source.js';
import { BaseRepository } from '../../../shared/repository/base.repository.js';

export class ProductTypeRepository extends BaseRepository {
  constructor() {
    super({ Model: models.ProductType });
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

  findByName(name) {
    return this.Model.findOne({
      where: { name },
      attributes: ['id', 'name', 'createdAt', 'updatedAt'],
    });
  }
}
