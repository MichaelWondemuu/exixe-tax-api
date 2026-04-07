import { DataTypes } from 'sequelize';
import { FORECAST_STATUS } from '../constants/excise.enums.js';

export const ExciseStampForecast = (sequelize) => {
  const model = sequelize.define(
    'ExciseStampForecast',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      forecastNumber: {
        type: DataTypes.STRING(64),
        allowNull: false,
        unique: true,
        field: 'forecast_number',
      },
      organizationId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'organization_id',
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
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'created_at',
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'updated_at',
      },
    },
    {
      sequelize,
      tableName: 'excise_stamp_forecasts',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: true,
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
