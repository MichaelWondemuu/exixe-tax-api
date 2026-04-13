import { DataTypes } from 'sequelize';
import { SUSPICIOUS_PRODUCT_REPORT_STATUS } from '../constants/enforcement.enums.js';

export const SuspiciousProductReport = (sequelize) => {
  const model = sequelize.define(
    'SuspiciousProductReport',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      productId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'product_id',
      },
      subjectOrganizationId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'subject_organization_id',
      },
      reportedByUserId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'reported_by_user_id',
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
        field: 'description',
      },
      reporterName: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'reporter_name',
      },
      reporterEmail: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'reporter_email',
      },
      reporterPhone: {
        type: DataTypes.STRING(64),
        allowNull: true,
        field: 'reporter_phone',
      },
      facilityId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'facility_id',
      },
      stampIdentifier: {
        type: DataTypes.STRING(256),
        allowNull: true,
        field: 'stamp_identifier',
      },
      evidence: {
        type: DataTypes.JSONB,
        allowNull: true,
        field: 'evidence',
      },
      status: {
        type: DataTypes.ENUM(...Object.values(SUSPICIOUS_PRODUCT_REPORT_STATUS)),
        allowNull: false,
        defaultValue: SUSPICIOUS_PRODUCT_REPORT_STATUS.SUBMITTED,
        field: 'status',
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
      tableName: 'suspicious_product_reports',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: true,
    },
  );

  model.ignoreOrganizationFilter = true;

  model.associate = (models) => {
    model.belongsTo(models.User, {
      foreignKey: 'reportedByUserId',
      as: 'reportedBy',
    });
    model.belongsTo(models.Organization, {
      foreignKey: 'subjectOrganizationId',
      as: 'subjectOrganization',
    });
    model.belongsTo(models.ExciseFacility, {
      foreignKey: 'facilityId',
      as: 'facility',
    });
    model.belongsTo(models.Product, {
      foreignKey: 'productId',
      as: 'product',
    });
  };

  return model;
};
