import { DataTypes } from 'sequelize';

export const PredeclarationItem = (sequelize) => {
  const model = sequelize.define(
    'PredeclarationItem',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      predeclarationId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'predeclaration_id',
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
      packagingId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'packaging_id',
      },
      packageLevel: {
        type: DataTypes.ENUM('UNIT', 'INNER_PACK', 'CASE', 'PALLET'),
        allowNull: false,
        defaultValue: 'UNIT',
        field: 'package_level',
      },
      parentItemId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'parent_item_id',
      },
      unitsPerParent: {
        type: DataTypes.DECIMAL(18, 3),
        allowNull: true,
        field: 'units_per_parent',
      },
      quantity: {
        type: DataTypes.DECIMAL(18, 3),
        allowNull: false,
        field: 'quantity',
      },
      unitValueSnapshot: {
        type: DataTypes.DECIMAL(18, 3),
        allowNull: true,
        field: 'unit_value_snapshot',
      },
      sellingPriceSnapshot: {
        type: DataTypes.DECIMAL(18, 2),
        allowNull: true,
        field: 'selling_price_snapshot',
      },
      remarks: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'remarks',
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
      tableName: 'predeclaration_items',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: true,
    },
  );

  model.associate = (models) => {
    model.belongsTo(models.Predeclaration, {
      foreignKey: 'predeclarationId',
      as: 'predeclaration',
    });
    model.belongsTo(models.Product, {
      foreignKey: 'productId',
      as: 'product',
    });
    model.belongsTo(models.ProductVariant, {
      foreignKey: 'productVariantId',
      as: 'productVariant',
    });
    model.belongsTo(models.Packaging, {
      foreignKey: 'packagingId',
      as: 'packaging',
    });
    model.belongsTo(models.PredeclarationItem, {
      foreignKey: 'parentItemId',
      as: 'parentItem',
    });
    model.hasMany(models.PredeclarationItem, {
      foreignKey: 'parentItemId',
      as: 'childItems',
    });
  };

  model.ignoreOrganizationFilter = true;
  return model;
};
