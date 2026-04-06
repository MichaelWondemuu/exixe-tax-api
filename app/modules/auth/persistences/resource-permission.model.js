import { DataTypes } from 'sequelize';

export const resourcePermission = (sequelize) => {
  const model = sequelize.define(
    'resourcePermission',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      resourceId: {
        type: DataTypes.UUID,
        field: 'resource_id',
        allowNull: false,
      },
      permissionId: {
        type: DataTypes.UUID,
        field: 'permission_id',
        allowNull: false,
      },
      code: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
      },
      createdAt: {
        type: DataTypes.DATE,
        field: 'created_at',
        allowNull: true,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      tableName: 'resource_permissions',
      timestamps: false,
      underscored: true,
      createdAt: false,
      updatedAt: false,
    }
  );

  model.associate = (models) => {
    // resourcePermission <-> Role (Many-to-Many)
    // Use RoleResourcePermission junction table defined in role.model.js
    const RoleResourcePermission = sequelize.models.RoleResourcePermission;
    if (RoleResourcePermission) {
      model.belongsToMany(models.Role, {
        through: RoleResourcePermission,
        foreignKey: 'resourcePermissionId',
        as: 'roles',
      });
    }

    // resourcePermission -> Resource (Many-to-One)
    model.belongsTo(models.Resource, {
      foreignKey: 'resourceId',
      as: 'resource',
    });

    // resourcePermission -> Permission (Many-to-One)
    model.belongsTo(models.Permission, {
      foreignKey: 'permissionId',
      as: 'permission',
    });
  };

  return model;
};

