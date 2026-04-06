import { models } from '../../../shared/db/data-source.js';
import { BaseRepository } from '../../../shared/repository/base.repository.js';

const SECTOR_ATTRS = [
  'id',
  'parentId',
  'name',
  'code',
  'division',
  'majorGroup',
  'group',
  'licensingCategory',
  'verificationBodyId',
  'licensingAuthorityId',
  'expectedDailyTxnMin',
  'expectedDailyTxnMax',
  'expectedAvgTicketMin',
  'expectedAvgTicketMax',
  'expectedOpenTime',
  'expectedCloseTime',
  'riskThresholdPercent',
  'createdAt',
  'updatedAt',
];

const sectorIncludes = () => [
  {
    model: models.VerificationBody,
    as: 'verificationBody',
    required: false,
    attributes: ['id', 'name'],
  },
  {
    model: models.LicensingAuthority,
    as: 'licensingAuthority',
    required: false,
    attributes: ['id', 'name'],
  },
];

export class SectorRepository extends BaseRepository {
  constructor() {
    super({ Model: models.Sector });
  }

  destroyAll(transaction) {
    return this.Model.destroy({ where: {}, transaction });
  }

  bulkCreate(rows, options = {}) {
    if (!rows.length) return Promise.resolve([]);
    return this.Model.bulkCreate(rows, options);
  }

  findAllForTree() {
    return this.Model.findAll({
      order: [['parent_id', 'ASC'], ['name', 'ASC']],
      attributes: SECTOR_ATTRS,
      include: sectorIncludes(),
    });
  }

  findAllByParentFilter(where) {
    return this.Model.findAll({
      where: Object.keys(where).length ? where : undefined,
      order: [['name', 'ASC']],
      attributes: SECTOR_ATTRS,
      include: sectorIncludes(),
    });
  }

  findChildrenByParentId(parentId) {
    return this.Model.findAll({
      where: { parentId },
      order: [['name', 'ASC']],
      attributes: SECTOR_ATTRS,
      include: sectorIncludes(),
    });
  }

  findByPkWithGraph(id) {
    return this.Model.findByPk(id, {
      attributes: SECTOR_ATTRS,
      include: [
        {
          model: models.Sector,
          as: 'parent',
          required: false,
          attributes: SECTOR_ATTRS,
        },
        {
          model: models.Sector,
          as: 'children',
          required: false,
          attributes: SECTOR_ATTRS,
        },
        ...sectorIncludes(),
      ],
    });
  }
}

export { SECTOR_ATTRS };
