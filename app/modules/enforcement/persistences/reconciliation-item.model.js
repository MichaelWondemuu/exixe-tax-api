import { DataTypes } from 'sequelize';
import { RECONCILIATION_ITEM_SEVERITY } from '../constants/enforcement.enums.js';

export const ReconciliationItem = (sequelize) => {
  const model = sequelize.define(
    'ReconciliationItem',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      reconciliationRunId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'reconciliation_run_id',
      },
      organizationId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'organization_id',
      },
      facilityId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'facility_id',
      },
      productId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'product_id',
      },
      productVariantId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'product_variant_id',
      },
      lotOrBatchCode: {
        type: DataTypes.STRING(128),
        allowNull: true,
        field: 'lot_or_batch_code',
      },
      actualProducedQty: {
        type: DataTypes.DECIMAL(18, 3),
        allowNull: false,
        field: 'actual_produced_qty',
      },
      quantityOnHand: {
        type: DataTypes.DECIMAL(18, 3),
        allowNull: false,
        field: 'quantity_on_hand',
      },
      varianceQty: {
        type: DataTypes.DECIMAL(18, 3),
        allowNull: false,
        field: 'variance_qty',
      },
      variancePercent: {
        type: DataTypes.DECIMAL(8, 2),
        allowNull: true,
        field: 'variance_percent',
      },
      severity: {
        type: DataTypes.ENUM(...Object.values(RECONCILIATION_ITEM_SEVERITY)),
        allowNull: false,
        field: 'severity',
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
      tableName: 'reconciliation_items',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: true,
      indexes: [
        { fields: ['reconciliation_run_id'] },
        { fields: ['severity'] },
      ],
    },
  );

  model.ignoreOrganizationFilter = true;

  model.associate = (models) => {
    model.belongsTo(models.ReconciliationRun, {
      foreignKey: 'reconciliationRunId',
      as: 'run',
    });
    model.belongsTo(models.Organization, {
      foreignKey: 'organizationId',
      as: 'organization',
    });
    model.belongsTo(models.ExciseFacility, {
      foreignKey: 'facilityId',
      as: 'facility',
    });
    model.belongsTo(models.Product, {
      foreignKey: 'productId',
      as: 'product',
    });
    model.belongsTo(models.ProductVariant, {
      foreignKey: 'productVariantId',
      as: 'productVariant',
    });
  };

  return model;
};
