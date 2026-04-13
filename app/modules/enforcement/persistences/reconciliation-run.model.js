import { DataTypes } from 'sequelize';
import { RECONCILIATION_RUN_STATUS } from '../constants/enforcement.enums.js';

export const ReconciliationRun = (sequelize) => {
  const model = sequelize.define(
    'ReconciliationRun',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      runNumber: {
        type: DataTypes.STRING(64),
        allowNull: false,
        unique: true,
        field: 'run_number',
      },
      organizationId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'organization_id',
      },
      facilityId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'facility_id',
      },
      periodStart: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'period_start',
      },
      periodEnd: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'period_end',
      },
      status: {
        type: DataTypes.ENUM(...Object.values(RECONCILIATION_RUN_STATUS)),
        allowNull: false,
        defaultValue: RECONCILIATION_RUN_STATUS.COMPLETED,
        field: 'status',
      },
      totalItems: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: 'total_items',
      },
      totalVarianceQty: {
        type: DataTypes.DECIMAL(18, 3),
        allowNull: false,
        defaultValue: 0,
        field: 'total_variance_qty',
      },
      createdByUserId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'created_by_user_id',
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
      tableName: 'reconciliation_runs',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: true,
    },
  );

  model.ignoreOrganizationFilter = true;

  model.associate = (models) => {
    model.belongsTo(models.Organization, {
      foreignKey: 'organizationId',
      as: 'organization',
    });
    model.belongsTo(models.ExciseFacility, {
      foreignKey: 'facilityId',
      as: 'facility',
    });
    model.belongsTo(models.User, {
      foreignKey: 'createdByUserId',
      as: 'createdBy',
    });
    model.hasMany(models.ReconciliationItem, {
      foreignKey: 'reconciliationRunId',
      as: 'items',
    });
  };

  return model;
};
