import { models } from '../../../shared/db/data-source.js';
import { BaseRepository } from '../../../shared/repository/base.repository.js';

export class RoleRepository extends BaseRepository {
  constructor() {
    super({ Model: models.Role });
  }

  /**
   * Load user roles with resource permissions
   * This is used by scope-aware permission middleware
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Array of roles with ResourcePermissions loaded
   */
  async loadUserRolesWithPermissions(userId) {
    // Find user with roles and their resource permissions
    const user = await models.User.findByPk(userId, {
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
              attributes: ['id', 'code', 'resourceId', 'permissionId'],
            },
          ],
          attributes: [
            'id',
            'name',
            'isSystem',
            'roleScope',
            'organizationId',
            'branchId',
            'organizationName',
          ],
        },
      ],
    });

    if (!user || !user.roles) {
      return [];
    }

    // Return roles with resource permissions
    return user.roles.map((role) => ({
      id: role.id,
      name: role.name,
      isSystem: role.isSystem,
      roleScope: role.roleScope,
      organizationId: role.organizationId,
      branchId: role.branchId,
      organizationName: role.organizationName,
      resourcePermissions: role.resourcePermissions || [],
    }));
  }
}

