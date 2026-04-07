import { DataTypes } from 'sequelize';

/**
 * Self-registration "Organization" aggregate root (1:1 with OrgRegistrationApplication).
 * Not to be confused with auth `Organization`.
 */
export const SelfRegOrganization = (sequelize) => {
  const model = sequelize.define(
    'SelfRegOrganization',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      applicationId: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
        field: 'application_id',
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
    },
    {
      sequelize,
      tableName: 'self_reg_organizations',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  );

  model.ignoreOrganizationFilter = true;

  model.associate = (models) => {
    model.belongsTo(models.OrgRegistrationApplication, {
      foreignKey: 'application_id',
      as: 'application',
    });
    model.hasMany(models.SelfRegContact, {
      foreignKey: 'organization_id',
      as: 'contacts',
    });
    model.hasMany(models.SelfRegOrganizationAddress, {
      foreignKey: 'organization_id',
      as: 'organizationAddresses',
    });
    model.hasMany(models.SelfRegFacility, {
      foreignKey: 'organization_id',
      as: 'facilities',
    });
    model.hasMany(models.SelfRegLicense, {
      foreignKey: 'organization_id',
      as: 'licenses',
    });
    model.hasMany(models.SelfRegAttachment, {
      foreignKey: 'organization_id',
      as: 'attachments',
    });
    model.hasMany(models.SelfRegStandard, {
      foreignKey: 'organization_id',
      as: 'standards',
    });
  };

  return model;
};
