import { DataTypes } from 'sequelize';
import {
  STAMP_LABEL_CODE_FORMAT,
  STAMP_LABEL_PACKAGE_LEVEL,
  STAMP_LABEL_TEMPLATE_LIFECYCLE_STATUS,
  STAMP_LABEL_TEMPLATE_RESOLVED_BY,
} from '../constants/stamp-labels.enums.js';

export const StampLabelTemplate = (sequelize) => {
  const model = sequelize.define(
    'StampLabelTemplate',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      organizationId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'organization_id',
      },
      code: {
        type: DataTypes.STRING(128),
        allowNull: false,
        unique: true,
        field: 'code',
      },
      version: {
        type: DataTypes.STRING(32),
        allowNull: false,
        defaultValue: 'v1',
        field: 'version',
      },
      lifecycleStatus: {
        type: DataTypes.STRING(32),
        allowNull: false,
        defaultValue: STAMP_LABEL_TEMPLATE_LIFECYCLE_STATUS.ACTIVE,
        field: 'lifecycle_status',
      },
      resolvedBy: {
        type: DataTypes.STRING(32),
        allowNull: false,
        defaultValue: STAMP_LABEL_TEMPLATE_RESOLVED_BY.PRODUCT,
        field: 'resolved_by',
      },
      productId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'product_id',
      },
      variantId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'variant_id',
      },
      categoryId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'category_id',
      },
      codeFormat: {
        type: DataTypes.STRING(32),
        allowNull: false,
        defaultValue: STAMP_LABEL_CODE_FORMAT.QR,
        field: 'code_format',
      },
      uidPrefix: {
        type: DataTypes.STRING(64),
        allowNull: true,
        field: 'uid_prefix',
      },
      packageLevel: {
        type: DataTypes.STRING(32),
        allowNull: false,
        defaultValue: STAMP_LABEL_PACKAGE_LEVEL.UNIT,
        field: 'package_level',
      },
      qrEnabled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: 'qr_enabled',
      },
      serialPattern: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'serial_pattern',
      },
      colorCode: {
        type: DataTypes.STRING(32),
        allowNull: true,
        field: 'color_code',
      },
      labelStructure: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'label_structure',
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
      tableName: 'stamp_label_templates',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: true,
    },
  );

  model.associate = (models) => {
    model.belongsTo(models.Organization, { foreignKey: 'organizationId', as: 'organization' });
    model.belongsTo(models.Product, { foreignKey: 'productId', as: 'product' });
    model.belongsTo(models.ProductVariant, { foreignKey: 'variantId', as: 'variant' });
    model.belongsTo(models.Category, { foreignKey: 'categoryId', as: 'category' });
    model.hasMany(models.StampLabelTemplateSecurityFeature, {
      foreignKey: 'templateId',
      as: 'securityFeatures',
    });
  };

  return model;
};

export const StampLabelTemplateSecurityFeature = (sequelize) => {
  const model = sequelize.define(
    'StampLabelTemplateSecurityFeature',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      templateId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'template_id',
      },
      featureCode: {
        type: DataTypes.STRING(64),
        allowNull: false,
        field: 'feature_code',
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
      tableName: 'stamp_label_template_security_features',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: true,
      indexes: [
        {
          unique: true,
          fields: ['template_id', 'feature_code'],
          name: 'uniq_stamp_template_security_feature',
        },
      ],
    },
  );

  model.associate = (models) => {
    model.belongsTo(models.StampLabelTemplate, {
      foreignKey: 'templateId',
      as: 'template',
    });
  };

  return model;
};
