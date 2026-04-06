import { DataTypes } from 'sequelize';

export const Organization = (sequelize) => {
  const model = sequelize.define(
    'Organization',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      tenantId: {
        type: DataTypes.STRING(255),
        field: 'tenant_id',
        allowNull: true,
        unique: true,
      },
      isSystemOrganization: {
        type: DataTypes.BOOLEAN,
        field: 'is_system_organization',
        allowNull: false,
        defaultValue: false,
        comment:
          'Indicates if this is the single system-wide organization. At most one should be true.',
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        field: 'is_active',
        allowNull: false,
        defaultValue: true,
      },
      parentId: {
        type: DataTypes.UUID,
        field: 'parent_id',
        allowNull: true,
      },
      organizationType: {
        type: DataTypes.STRING(50),
        field: 'organization_type',
        allowNull: false,
        defaultValue: 'MAIN',
        validate: {
          isIn: [['MAIN', 'BRANCH', 'SUB_BRANCH', 'SISTER']],
        },
        comment:
          'Type of organization: MAIN (default), BRANCH, SUB_BRANCH, or SISTER',
      },
      country: {
        type: DataTypes.STRING(10),
        allowNull: true,
        defaultValue: 'ET',
      },
      regionId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'region_id',
        comment:
          'References lookup_regions.id; FK added via migration after lookup tables exist',
      },
      zoneId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'zone_id',
        comment:
          'References lookup_zones.id; FK added via migration after lookup tables exist',
      },
      woredaId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'woreda_id',
        comment:
          'References lookup_woredas.id; FK added via migration after lookup tables exist',
      },
      latitude: {
        type: DataTypes.DECIMAL(10, 7),
        allowNull: true,
        comment: 'Y coordinate (latitude) for map / location',
      },
      longitude: {
        type: DataTypes.DECIMAL(10, 7),
        allowNull: true,
        comment: 'X coordinate (longitude) for map / location',
      },
      sectorId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'sector_id',
        comment: 'References lookup_sectors.id (recursive sector hierarchy)',
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
      tableName: 'organizations',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      paranoid: true,
      deletedAt: 'deleted_at',
      underscored: true,
    },
  );

  model.associate = (models) => {
    model.hasOne(models.OrganizationDetail, {
      foreignKey: 'organizationId',
      as: 'detail',
    });

    model.hasMany(models.User, {
      foreignKey: 'organizationId',
      as: 'users',
    });

    model.belongsTo(models.Organization, {
      foreignKey: 'parentId',
      as: 'parent',
    });

    model.hasMany(models.Organization, {
      foreignKey: 'parentId',
      as: 'children',
    });

    if (models.Region) {
      model.belongsTo(models.Region, {
        foreignKey: 'regionId',
        as: 'region',
      });
    }
    if (models.Zone) {
      model.belongsTo(models.Zone, {
        foreignKey: 'zoneId',
        as: 'zone',
      });
    }
    if (models.Woreda) {
      model.belongsTo(models.Woreda, {
        foreignKey: 'woredaId',
        as: 'woreda',
      });
    }
    if (models.Sector) {
      model.belongsTo(models.Sector, {
        foreignKey: 'sectorId',
        as: 'sector',
      });
    }

    const SisterOrganization =
      sequelize.models.SisterOrganization ||
      sequelize.define(
        'SisterOrganization',
        {
          organizationId: {
            type: DataTypes.UUID,
            primaryKey: true,
            field: 'organization_id',
            // allowNull: false,
          },
          sisterOrganizationId: {
            type: DataTypes.UUID,
            primaryKey: true,
            field: 'sister_organization_id',
            // allowNull: false,
          },
        },
        {
          tableName: 'sister_organizations',
          timestamps: false,
        },
      );
    model.belongsToMany(models.Organization, {
      through: SisterOrganization,
      foreignKey: 'organizationId',
      otherKey: 'sisterOrganizationId',
      as: 'sisterOrganizations',
    });
  };

  return model;
};
