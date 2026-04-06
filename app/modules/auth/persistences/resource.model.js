import { DataTypes } from 'sequelize';

export const Resource = (sequelize) => {
  const model = sequelize.define(
    'Resource',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      key: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      createdAt: {
        type: DataTypes.DATE,
        field: 'created_at',
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        field: 'updated_at',
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      deletedAt: {
        type: DataTypes.DATE,
        field: 'deleted_at',
        allowNull: true,
      },
      createdBy: {
        type: DataTypes.UUID,
        field: 'created_by',
        allowNull: true,
      },
      updatedBy: {
        type: DataTypes.UUID,
        field: 'updated_by',
        allowNull: true,
      },
      deletedBy: {
        type: DataTypes.UUID,
        field: 'deleted_by',
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: 'resources',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      paranoid: true,
      deletedAt: 'deleted_at',
      underscored: true,
    }
  );

  model.associate = (models) => {
    // Resource -> resourcePermission (One-to-Many)
    model.hasMany(models.resourcePermission, {
      foreignKey: 'resourceId',
      as: 'resourcePermissions',
    });
  };

  return model;
};

