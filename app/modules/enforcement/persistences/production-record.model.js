import { DataTypes } from 'sequelize';

export const ProductionRecord = (sequelize) => {
  const model = sequelize.define(
    'ProductionRecord',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
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
      producedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'produced_at',
      },
      remarks: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'remarks',
      },
      evidence: {
        type: DataTypes.JSONB,
        allowNull: true,
        field: 'evidence',
      },
      reportedByUserId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'reported_by_user_id',
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
      tableName: 'production_records',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: true,
      indexes: [
        { fields: ['organization_id', 'produced_at'] },
        { fields: ['product_id', 'produced_at'] },
      ],
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
    model.belongsTo(models.Product, {
      foreignKey: 'productId',
      as: 'product',
    });
    model.belongsTo(models.ProductVariant, {
      foreignKey: 'productVariantId',
      as: 'productVariant',
    });
    model.belongsTo(models.User, {
      foreignKey: 'reportedByUserId',
      as: 'reportedBy',
    });
  };

  return model;
};
