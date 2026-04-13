import { DataTypes } from 'sequelize';
import { getBaseFields, getBaseOptions } from '../../../shared/db/base.model.js';
import { FACILITY_TYPES } from '../constants/excise.enums.js';

export const ExciseFacility = (sequelize) => {
  const base = getBaseFields();
  const model = sequelize.define(
    'ExciseFacility',
    {
      ...base,
      organizationId: {
        ...base.organizationId,
        allowNull: true,
      },
      code: {
        type: DataTypes.STRING(64),
        allowNull: false,
        field: 'code',
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'name',
      },
      facilityType: {
        type: DataTypes.ENUM(...Object.values(FACILITY_TYPES)),
        allowNull: false,
        field: 'facility_type',
      },
      licenseNumber: {
        type: DataTypes.STRING(128),
        allowNull: true,
        field: 'license_number',
      },
      region: {
        type: DataTypes.STRING(128),
        allowNull: true,
        field: 'region',
      },
      zone: {
        type: DataTypes.STRING(128),
        allowNull: true,
        field: 'zone',
      },
      woreda: {
        type: DataTypes.STRING(128),
        allowNull: true,
        field: 'woreda',
      },
      city: {
        type: DataTypes.STRING(128),
        allowNull: true,
        field: 'city',
      },
      addressLine1: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'address_line_1',
      },
      addressLine2: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'address_line_2',
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: 'is_active',
      },
    },
    {
      ...getBaseOptions('excise_facilities'),
      indexes: [
        {
          unique: true,
          fields: ['code'],
          name: 'unique_excise_facility_code',
        },
      ],
    },
  );

  model.associate = (models) => {
    model.belongsTo(models.Organization, {
      foreignKey: 'organizationId',
      as: 'organization',
    });
    model.hasMany(models.ExciseDeliveryNote, {
      foreignKey: 'fromFacilityId',
      as: 'outboundDeliveryNotes',
    });
    model.hasMany(models.ExciseDeliveryNote, {
      foreignKey: 'toFacilityId',
      as: 'inboundDeliveryNotes',
    });
    model.hasMany(models.ExciseStampRequest, {
      foreignKey: 'facilityId',
      as: 'stampRequests',
    });
  };

  return model;
};
