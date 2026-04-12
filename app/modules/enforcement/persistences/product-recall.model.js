import { DataTypes } from 'sequelize';
import {
  PRODUCT_RECALL_SEVERITY,
  PRODUCT_RECALL_STATUS,
} from '../constants/enforcement.enums.js';

export const ProductRecall = (sequelize) => {
  const model = sequelize.define(
    'ProductRecall',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      title: {
        type: DataTypes.STRING(500),
        allowNull: false,
        field: 'title',
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'description',
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
      subjectOrganizationId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'subject_organization_id',
      },
      severity: {
        type: DataTypes.ENUM(...Object.values(PRODUCT_RECALL_SEVERITY)),
        allowNull: false,
        defaultValue: PRODUCT_RECALL_SEVERITY.MEDIUM,
        field: 'severity',
      },
      status: {
        type: DataTypes.ENUM(...Object.values(PRODUCT_RECALL_STATUS)),
        allowNull: false,
        defaultValue: PRODUCT_RECALL_STATUS.DRAFT,
        field: 'status',
      },
      initiatedByUserId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'initiated_by_user_id',
      },
      publishedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'published_at',
      },
      effectiveFrom: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'effective_from',
      },
      effectiveTo: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'effective_to',
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
      tableName: 'product_recalls',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: true,
      indexes: [
        { fields: ['product_id', 'status'] },
        { fields: ['status', 'published_at'] },
      ],
    },
  );

  model.ignoreOrganizationFilter = true;

  model.associate = (models) => {
    model.belongsTo(models.User, {
      foreignKey: 'initiatedByUserId',
      as: 'initiatedBy',
    });
    model.belongsTo(models.Organization, {
      foreignKey: 'subjectOrganizationId',
      as: 'subjectOrganization',
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
