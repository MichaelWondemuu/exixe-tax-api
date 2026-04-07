import { DataTypes } from 'sequelize';

/**
 * Organization-specific variant overrides/custom variants.
 * Table: organization_product_variants
 */
export const OrganizationProductVariant = (sequelize) => {
  const model = sequelize.define(
    'OrganizationProductVariant',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      organizationProductId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'organization_product_id',
      },
      productVariantId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'product_variant_id',
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'name',
      },
      sku: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: 'sku',
      },
      unitValue: {
        type: DataTypes.DECIMAL(18, 3),
        allowNull: true,
        field: 'unit_value',
      },
      sellingPrice: {
        type: DataTypes.DECIMAL(18, 2),
        allowNull: true,
        field: 'selling_price',
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
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
      tableName: 'organization_product_variants',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: true,
    },
  );

  model.associate = (models) => {
    model.belongsTo(models.OrganizationProduct, {
      foreignKey: 'organizationProductId',
      as: 'organizationProduct',
    });
    model.belongsTo(models.ProductVariant, {
      foreignKey: 'productVariantId',
      as: 'productVariant',
    });
    model.hasMany(models.OrganizationProductVariantAttribute, {
      foreignKey: 'organizationProductVariantId',
      as: 'attributes',
      onDelete: 'CASCADE',
      hooks: true,
    });
  };

  return model;
};
