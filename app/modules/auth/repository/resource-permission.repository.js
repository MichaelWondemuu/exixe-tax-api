import { models } from '../../../shared/db/data-source.js';
import { BaseRepository } from '../../../shared/repository/base.repository.js';

export class ResourcePermissionRepository extends BaseRepository {
  constructor() {
    super({ Model: models.resourcePermission });
  }

  /**
   * Find resource permission with resource and permission
   */
  async findByIdWithDetails(req, id) {
    return this.findById(req, id, {
      include: [
        {
          model: models.Resource,
          as: 'resource',
          required: false,
        },
        {
          model: models.Permission,
          as: 'permission',
          required: false,
        },
      ],
    });
  }
}

