import { DataTypes } from 'sequelize';

/**
 * Organization-specific product overrides/custom entries.
 * Table: organization_products
 */
export const OrganizationProduct = (sequelize) => {
  const model = sequelize.define(
    'OrganizationProduct',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      organizationId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'organization_id',
      },
      productId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'product_id',
      },
      categoryId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'category_id',
      },
      productTypeId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'product_type_id',
      },
      measurementId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'measurement_id',
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'name',
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'description',
      },
      imageUrl: {
        type: DataTypes.STRING(500),
        allowNull: true,
        field: 'image_url',
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
      tableName: 'organization_products',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: true,
      indexes: [
        {
          unique: true,
          fields: ['organization_id', 'product_id'],
        },
      ],
    },
  );

  model.associate = (models) => {
    model.belongsTo(models.Organization, {
      foreignKey: 'organizationId',
      as: 'organization',
    });
    model.belongsTo(models.Category, {
      foreignKey: 'categoryId',
      as: 'category',
    });
    model.belongsTo(models.ProductType, {
      foreignKey: 'productTypeId',
      as: 'productType',
    });
    model.belongsTo(models.Measurement, {
      foreignKey: 'measurementId',
      as: 'measurement',
    });
    model.belongsTo(models.Product, {
      foreignKey: 'productId',
      as: 'product',
    });
    model.hasMany(models.OrganizationProductVariant, {
      foreignKey: 'organizationProductId',
      as: 'variants',
      onDelete: 'CASCADE',
      hooks: true,
    });
  };

  return model;
};
