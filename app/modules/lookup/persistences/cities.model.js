import { DataTypes } from 'sequelize';

/**
 * Lookup reference data: Region -> Zone -> Woreda
 * Uses integer PKs to match uploaded JSON ids and preserve relations.
 */
export const Region = (sequelize) => {
  const model = sequelize.define(
    'Region',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: false,
        allowNull: false,
        comment: 'Explicit id on upload to preserve relations from JSON',
      },
      code: {
        type: DataTypes.STRING(20),
        allowNull: true,
        field: 'code',
      },
      description: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: 'description',
      },
      region_type: {
        type: DataTypes.STRING(10),
        allowNull: true,
        field: 'region_type',
      },
      description_amh: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: 'description_amh',
      },
      deletedAt: {
        type: DataTypes.DATE,
        field: 'deleted_at',
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: 'lookup_regions',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      paranoid: true,
      deletedAt: 'deleted_at',
      underscored: true,
    },
  );
  model.ignoreOrganizationFilter = true;
  model.associate = (models) => {
    model.hasMany(models.Zone, {
      as: 'zones',
      foreignKey: 'region_id',
    });
  };
  return model;
};

export const Zone = (sequelize) => {
  const model = sequelize.define(
    'Zone',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: false,
        allowNull: false,
      },
      region_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'region_id',
        references: { model: 'lookup_regions', key: 'id' },
      },
      code: {
        type: DataTypes.STRING(20),
        allowNull: true,
        field: 'code',
      },
      description: {
        type: DataTypes.STRING(100),
        allowNull: false,
        field: 'description',
      },
      description_amh: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: 'description_amh',
      },
      deletedAt: {
        type: DataTypes.DATE,
        field: 'deleted_at',
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: 'lookup_zones',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      paranoid: true,
      deletedAt: 'deleted_at',
      underscored: true,
    },
  );
  model.ignoreOrganizationFilter = true;
  model.associate = (models) => {
    model.belongsTo(models.Region, {
      as: 'region',
      foreignKey: 'region_id',
    });
    model.hasMany(models.Woreda, {
      as: 'woredas',
      foreignKey: 'zone_id',
    });
  };
  return model;
};

export const Woreda = (sequelize) => {
  const model = sequelize.define(
    'Woreda',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: false,
        allowNull: false,
      },
      zone_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'zone_id',
        references: { model: 'lookup_zones', key: 'id' },
      },
      code: {
        type: DataTypes.STRING(20),
        allowNull: true,
        field: 'code',
      },
      description: {
        type: DataTypes.STRING(150),
        allowNull: true,
        field: 'description',
      },
      description_amh: {
        type: DataTypes.STRING(150),
        allowNull: true,
        field: 'description_amh',
      },
      deletedAt: {
        type: DataTypes.DATE,
        field: 'deleted_at',
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: 'lookup_woredas',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      paranoid: true,
      deletedAt: 'deleted_at',
      underscored: true,
    },
  );
  model.ignoreOrganizationFilter = true;
  model.associate = (models) => {
    model.belongsTo(models.Zone, {
      as: 'zone',
      foreignKey: 'zone_id',
    });
  };
  return model;
};
