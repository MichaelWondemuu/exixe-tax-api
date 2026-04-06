import { DataTypes } from 'sequelize';

/**
 * Product entity.
 * Table: products
 */
export const Product = (sequelize) => {
  const model = sequelize.define(
    'Product',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'name',
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'description',
      },
      sku: {
        type: DataTypes.STRING(100),
        allowNull: true,
        unique: true,
        field: 'sku',
      },
      categoryId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'category_id',
      },
      productTypeId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'product_type_id',
      },
      measurementId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'measurement_id',
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
      imageUrl: {
        type: DataTypes.STRING(500),
        allowNull: true,
        field: 'image_url',
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
      tableName: 'products',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: true,
    },
  );

  model.associate = (models) => {
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
  };

  return model;
};
