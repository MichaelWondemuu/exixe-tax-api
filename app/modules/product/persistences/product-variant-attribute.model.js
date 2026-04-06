import { DataTypes } from 'sequelize';

/**
 * Product variant attribute key/value.
 * Table: product_variant_attributes
 */
export const ProductVariantAttribute = (sequelize) => {
  const model = sequelize.define(
    'ProductVariantAttribute',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      variantId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'variant_id',
      },
      key: {
        type: DataTypes.STRING(100),
        allowNull: false,
        field: 'key',
      },
      value: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'value',
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
      tableName: 'product_variant_attributes',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: true,
    },
  );

  model.associate = (models) => {
    model.belongsTo(models.ProductVariant, {
      foreignKey: 'variantId',
      as: 'variant',
    });
  };

  return model;
};
