import { DataTypes } from 'sequelize';
import {
  getBaseFields,
  getBaseOptions,
} from '../../../shared/db/base.model.js';
import { FORECAST_STATUS } from '../constants/excise.enums.js';

export const ExciseStampForecast = (sequelize) => {
  const base = getBaseFields();
  const model = sequelize.define(
    'ExciseStampForecast',
    {
      ...base,
      organizationId: {
        ...base.organizationId,
        allowNull: true,
      },
      forecastNumber: {
        type: DataTypes.STRING(64),
        allowNull: false,
        field: 'forecast_number',
      },
      facilityId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'facility_id',
      },
      goodsCategory: {
        type: DataTypes.STRING(128),
        allowNull: false,
        field: 'goods_category',
      },
      startMonth: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        field: 'start_month',
      },
      monthlyPlan: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: [],
        field: 'monthly_plan',
      },
      status: {
        type: DataTypes.STRING(32),
        allowNull: false,
        defaultValue: FORECAST_STATUS.DRAFT,
        field: 'status',
      },
      submittedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'submitted_at',
      },
    },
    {
      ...getBaseOptions('excise_stamp_forecasts'),
      indexes: [
        {
          unique: true,
          fields: [{ name: 'forecast_number' }],
          name: 'unique_excise_stamp_forecast_number',
        },
      ],
    },
  );

  model.associate = (models) => {
    model.belongsTo(models.Organization, {
      foreignKey: 'organizationId',
      as: 'organization',
    });
    model.belongsTo(models.ExciseFacility, {
      foreignKey: 'facilityId',
      as: 'facility',
    });
  };

  return model;
};
