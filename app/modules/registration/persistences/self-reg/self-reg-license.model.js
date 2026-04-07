import { DataTypes } from 'sequelize';

export const SelfRegLicense = (sequelize) => {
  const model = sequelize.define(
    'SelfRegLicense',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      organizationId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'organization_id',
      },
      licenseType: {
        type: DataTypes.STRING(128),
        allowNull: false,
        field: 'license_type',
      },
      licenseNumber: {
        type: DataTypes.STRING(128),
        allowNull: false,
        field: 'license_number',
      },
      issuedDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        field: 'issued_date',
      },
      expiryDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        field: 'expiry_date',
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
      tableName: 'self_reg_licenses',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  );

  model.ignoreOrganizationFilter = true;

  model.associate = (models) => {
    model.belongsTo(models.SelfRegOrganization, {
      foreignKey: 'organization_id',
      as: 'organization',
    });
  };

  return model;
};
