import { DataTypes } from 'sequelize';

/**
 * Organization product variant attribute overrides/custom attributes.
 * Table: organization_product_variant_attributes
 */
export const OrganizationProductVariantAttribute = (sequelize) => {
  const model = sequelize.define(
    'OrganizationProductVariantAttribute',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      organizationProductVariantId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'organization_product_variant_id',
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
      tableName: 'organization_product_variant_attributes',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: true,
    },
  );

  model.associate = (models) => {
    model.belongsTo(models.OrganizationProductVariant, {
      foreignKey: 'organizationProductVariantId',
      as: 'organizationProductVariant',
    });
  };

  return model;
};
