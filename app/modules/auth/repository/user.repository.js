import { models } from '../../../shared/db/data-source.js';
import { BaseRepository } from '../../../shared/repository/base.repository.js';
import { Op } from 'sequelize';

export class UserRepository extends BaseRepository {
  constructor() {
    super({ Model: models.User });
  }

  /**
   * Find user by id with roles (and organization when requester is system).
   * When req.user.isSystem, includes only admin role and organization.
   */
  async findByIdWithRoles(req, id) {
    const isSystem = req?.user?.isSystem === true;
    const roleInclude = {
      model: models.Role,
      as: 'roles',
      required: false,
      include: [
        {
          model: models.resourcePermission,
          as: 'resourcePermissions',
          required: false,
        },
      ],
    };
    if (isSystem) {
      roleInclude.where = { name: 'admin' };
    }
    const include = [roleInclude];
    if (isSystem) {
      include.push({
        model: models.Organization,
        as: 'organization',
        required: false,
      });
    }
    return this.findById(req, id, { include });
  }

  async findByAccountIdOrPhone(req, accountId, phone) {
    if (!accountId) {
      return this.Model.findAll({
        where: {
          phone: phone,
        },
        include: [
          {
            model: models.Organization,
            as: 'organization',
            required: false,
          },
        ],
        order: [
          ['isDefault', 'DESC'],
          ['createdAt', 'ASC'],
        ],
      });
    }

    return this.Model.findAll({
      where: {
        [Op.or]: [{ accountId: accountId }, { phone: phone }],
      },
      include: [
        {
          model: models.Organization,
          as: 'organization',
          required: false,
        },
      ],
      order: [
        ['isDefault', 'DESC'],
        ['createdAt', 'ASC'],
      ],
    });
  }

  async findByIdWithDetails(req, id) {
    return this.Model.findByPk(id, {
      include: [
        {
          model: models.Role,
          as: 'roles',
          required: false,
          include: [
            {
              model: models.resourcePermission,
              as: 'resourcePermissions',
              required: false,
            },
          ],
        },
        {
          model: models.Organization,
          as: 'organization',
          required: false,
        },
      ],
    });
  }
}

