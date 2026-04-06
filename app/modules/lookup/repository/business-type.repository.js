import { models } from '../../../shared/db/data-source.js';
import { BaseRepository } from '../../../shared/repository/base.repository.js';

const DEFAULT_BUSINESS_TYPES = [
  { code: 'MANUFACTURER', name: 'Manufacturer', displayOrder: 1 },
  { code: 'IMPORTER', name: 'Importer', displayOrder: 2 },
  { code: 'DISTRIBUTOR', name: 'Distributor', displayOrder: 3 },
];

export async function ensureDefaultBusinessTypes() {
  for (const row of DEFAULT_BUSINESS_TYPES) {
    await models.BusinessType.findOrCreate({
      where: { code: row.code },
      defaults: {
        name: row.name,
        displayOrder: row.displayOrder,
      },
    });
  }
}

export class BusinessTypeRepository extends BaseRepository {
  constructor() {
    super({ Model: models.BusinessType });
  }

  findByIdRaw(id) {
    return this.Model.findByPk(id, { attributes: ['id', 'code', 'name'] });
  }

  findAllOrdered() {
    return this.Model.findAll({
      order: [['display_order', 'ASC'], ['name', 'ASC']],
      attributes: ['id', 'code', 'name', 'displayOrder'],
    });
  }
}
