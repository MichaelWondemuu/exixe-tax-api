import { models } from '../../../shared/db/data-source.js';
import { BaseRepository } from '../../../shared/repository/base.repository.js';

export class CategoryRepository extends BaseRepository {
  constructor() {
    super({ Model: models.Category });
  }

  findAllListed() {
    return this.Model.findAll({
      attributes: [
        'id',
        'name',
        'code',
        'status',
        'color',
        'description',
        'createdAt',
        'updatedAt',
      ],
      order: [['name', 'ASC']],
    });
  }

  findByPkListed(id) {
    return this.Model.findByPk(id, {
      attributes: [
        'id',
        'name',
        'code',
        'status',
        'color',
        'description',
        'createdAt',
        'updatedAt',
      ],
    });
  }

  findByName(name) {
    return this.Model.findOne({
      where: { name },
      attributes: [
        'id',
        'name',
        'code',
        'status',
        'color',
        'description',
        'createdAt',
        'updatedAt',
      ],
    });
  }

  findByCode(code) {
    return this.Model.findOne({
      where: { code },
      attributes: [
        'id',
        'name',
        'code',
        'status',
        'color',
        'description',
        'createdAt',
        'updatedAt',
      ],
    });
  }
}
