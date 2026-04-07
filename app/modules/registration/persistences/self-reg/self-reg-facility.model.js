import { DataTypes } from 'sequelize';
import { FACILITY_TYPES } from '../../constants/self-registration.enums.js';

export const SelfRegFacility = (sequelize) => {
  const model = sequelize.define(
    'SelfRegFacility',
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
      name: { type: DataTypes.STRING(255), allowNull: false },
      facilityType: {
        type: DataTypes.STRING(32),
        allowNull: false,
        field: 'facility_type',
        validate: { isIn: [FACILITY_TYPES] },
      },
      licenseNumber: {
        type: DataTypes.STRING(128),
        allowNull: true,
        field: 'license_number',
      },
      capacity: { type: DataTypes.STRING(128), allowNull: true },
      numberOfEmployees: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'number_of_employees',
      },
      addressId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'address_id',
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
      tableName: 'self_reg_facilities',
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
    model.belongsTo(models.SelfRegAddress, {
      foreignKey: 'address_id',
      as: 'siteAddress',
    });
  };

  return model;
};
