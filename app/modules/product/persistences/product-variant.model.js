import { DataTypes } from 'sequelize';

/**
 * Product variant entity.
 * Table: product_variants
 */
export const ProductVariant = (sequelize) => {
  const model = sequelize.define(
    'ProductVariant',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      productId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'product_id',
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'name',
      },
      sku: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        field: 'sku',
      },
      unitValue: {
        type: DataTypes.DECIMAL(18, 3),
        allowNull: false,
        defaultValue: 1,
        field: 'unit_value',
      },
      sellingPrice: {
        type: DataTypes.DECIMAL(18, 2),
        allowNull: false,
        defaultValue: 0,
        field: 'selling_price',
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: 'is_active',
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
      tableName: 'product_variants',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: true,
    },
  );

  model.associate = (models) => {
    model.belongsTo(models.Product, {
      foreignKey: 'productId',
      as: 'product',
    });
    model.hasMany(models.ProductVariantAttribute, {
      foreignKey: 'variantId',
      as: 'attributes',
      onDelete: 'CASCADE',
      hooks: true,
    });
  };

  return model;
};
