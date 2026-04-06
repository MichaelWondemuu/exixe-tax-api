import { DataTypes } from 'sequelize';
import { getBaseFields, getBaseOptions } from '../../../shared/db/base.model.js';

export const Role = (sequelize) => {
  const model = sequelize.define(
    'Role',
    {
      ...getBaseFields(),
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      isSystem: {
        type: DataTypes.BOOLEAN,
        field: 'is_system',
        allowNull: false,
        defaultValue: false,
      },
      organizationName: {
        type: DataTypes.STRING(255),
        field: 'organization_name',
        allowNull: true,
      },
    },
    {
      ...getBaseOptions('roles'),
      indexes: [
        {
          unique: true,
          fields: ['organization_id', 'name'],
          name: 'unique_role_organization_name',
        },
      ],
    }
  );

  model.associate = (models) => {
    // Role <-> User (Many-to-Many)
    // Use UserRole junction table defined in user.model.js
    const UserRole = sequelize.models.UserRole;
    if (UserRole) {
      model.belongsToMany(models.User, {
        through: UserRole,
        foreignKey: 'roleId',
        as: 'users',
      });
    }

    // Role <-> resourcePermission (Many-to-Many)
    // Define RoleResourcePermission junction table
    const RoleResourcePermission =
      sequelize.models.RoleResourcePermission ||
      sequelize.define(
        'RoleResourcePermission',
        {
          roleId: {
            type: DataTypes.UUID,
            primaryKey: true,
            field: 'role_id',
          },
          resourcePermissionId: {
            type: DataTypes.UUID,
            primaryKey: true,
            field: 'resource_permission_id',
          },
        },
        {
          tableName: 'role_resource_permissions',
          timestamps: false,
        }
      );
    model.belongsToMany(models.resourcePermission, {
      through: RoleResourcePermission,
      foreignKey: 'roleId',
      as: 'resourcePermissions',
    });
  };

  return model;
};

