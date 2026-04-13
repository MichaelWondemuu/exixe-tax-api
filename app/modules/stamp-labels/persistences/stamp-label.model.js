import { DataTypes } from 'sequelize';
import {
  STAMP_LABEL_CODE_FORMAT,
  STAMP_LABEL_LIFECYCLE_STATUS,
  STAMP_LABEL_OPERATOR_TYPE,
  STAMP_LABEL_PACKAGE_LEVEL,
} from '../constants/stamp-labels.enums.js';

export const StampLabel = (sequelize) => {
  const model = sequelize.define(
    'StampLabel',
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
      stampRequestId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'stamp_request_id',
      },
      stampRequestNumber: {
        type: DataTypes.STRING(64),
        allowNull: false,
        field: 'stamp_request_number',
      },
      templateId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'template_id',
      },
      templateCode: {
        type: DataTypes.STRING(128),
        allowNull: true,
        field: 'template_code',
      },
      templateVersion: {
        type: DataTypes.STRING(32),
        allowNull: true,
        field: 'template_version',
      },
      templateLifecycleStatus: {
        type: DataTypes.STRING(32),
        allowNull: true,
        field: 'template_lifecycle_status',
      },
      templateResolvedBy: {
        type: DataTypes.STRING(32),
        allowNull: true,
        field: 'template_resolved_by',
      },
      templateQrEnabled: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        field: 'template_qr_enabled',
      },
      templateSerialPattern: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'template_serial_pattern',
      },
      templateSecurityFeatures: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: [],
        field: 'template_security_features',
      },
      templateLabelStructure: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'template_label_structure',
      },
      stampUid: {
        type: DataTypes.STRING(128),
        allowNull: false,
        field: 'stamp_uid',
      },
      digitalLink: {
        type: DataTypes.STRING(512),
        allowNull: true,
        field: 'digital_link',
      },
      codeFormat: {
        type: DataTypes.STRING(32),
        allowNull: false,
        defaultValue: STAMP_LABEL_CODE_FORMAT.GS1_DATAMATRIX,
        field: 'code_format',
      },
      status: {
        type: DataTypes.STRING(32),
        allowNull: false,
        defaultValue: STAMP_LABEL_LIFECYCLE_STATUS.GENERATED,
        field: 'status',
      },
      operatorType: {
        type: DataTypes.STRING(32),
        allowNull: false,
        field: 'operator_type',
      },
      operatorName: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'operator_name',
      },
      operatorTin: {
        type: DataTypes.STRING(64),
        allowNull: false,
        field: 'operator_tin',
      },
      operatorLicenseNumber: {
        type: DataTypes.STRING(128),
        allowNull: true,
        field: 'operator_license_number',
      },
      merchantId: {
        type: DataTypes.STRING(128),
        allowNull: true,
        field: 'merchant_id',
      },
      merchantName: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'merchant_name',
      },
      ethiopiaRevenueOffice: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'ethiopia_revenue_office',
      },
      productId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'product_id',
      },
      productName: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'product_name',
      },
      packageLevel: {
        type: DataTypes.STRING(32),
        allowNull: false,
        defaultValue: STAMP_LABEL_PACKAGE_LEVEL.UNIT,
        field: 'package_level',
      },
      batchNumber: {
        type: DataTypes.STRING(128),
        allowNull: true,
        field: 'batch_number',
      },
      batchId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'batch_id',
      },
      productionDate: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'production_date',
      },
      forecastReference: {
        type: DataTypes.STRING(128),
        allowNull: true,
        field: 'forecast_reference',
      },
      forecastSubmittedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'forecast_submitted_at',
      },
      requiresSixtyDayForecast: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: 'requires_sixty_day_forecast',
      },
      isImported: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: 'is_imported',
      },
      customsDeclarationNumber: {
        type: DataTypes.STRING(128),
        allowNull: true,
        field: 'customs_declaration_number',
      },
      generatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'generated_at',
      },
      issuedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'issued_at',
      },
      assignedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'assigned_at',
      },
      appliedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'applied_at',
      },
      activatedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'activated_at',
      },
      trackedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'tracked_at',
      },
      verifiedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'verified_at',
      },
      auditedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'audited_at',
      },
      revokedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'revoked_at',
      },
      assignedToOperatorId: {
        type: DataTypes.STRING(128),
        allowNull: true,
        field: 'assigned_to_operator_id',
      },
      applicationLineCode: {
        type: DataTypes.STRING(128),
        allowNull: true,
        field: 'application_line_code',
      },
      activationLocationCode: {
        type: DataTypes.STRING(128),
        allowNull: true,
        field: 'activation_location_code',
      },
      lastKnownLocationCode: {
        type: DataTypes.STRING(128),
        allowNull: true,
        field: 'last_known_location_code',
      },
      lastVerificationResult: {
        type: DataTypes.STRING(32),
        allowNull: true,
        field: 'last_verification_result',
      },
      enforcementState: {
        type: DataTypes.STRING(32),
        allowNull: true,
        field: 'enforcement_state',
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'notes',
      },
      metadata: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {},
        field: 'metadata',
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
      tableName: 'stamp_labels',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: true,
      indexes: [
        {
          unique: true,
          fields: [{ name: 'stamp_uid' }],
          name: 'unique_stamp_label_stamp_uid',
        },
      ],
    },
  );

  model.associate = (models) => {
    model.belongsTo(models.Organization, {
      foreignKey: 'organizationId',
      as: 'organization',
    });
    // Avoid Sequelize sync/alter managing this FK (fails when orphan stamp_request_id rows exist).
    model.belongsTo(models.ExciseStampRequest, {
      foreignKey: 'stampRequestId',
      as: 'stampRequest',
      constraints: false,
    });
    model.belongsTo(models.StampLabelTemplate, {
      foreignKey: 'templateId',
      as: 'template',
    });
    model.belongsTo(models.Product, {
      foreignKey: 'productId',
      as: 'product',
    });
    model.belongsTo(models.StampLabelBatch, {
      foreignKey: 'batchId',
      as: 'batch',
    });
    model.hasMany(models.StampLabelEvent, {
      foreignKey: 'stampLabelId',
      as: 'events',
    });
  };

  // Keep enum values centralized even when DB columns are string-based.
  model.lifecycleStatuses = STAMP_LABEL_LIFECYCLE_STATUS;
  model.operatorTypes = STAMP_LABEL_OPERATOR_TYPE;
  model.codeFormats = STAMP_LABEL_CODE_FORMAT;
  model.packageLevels = STAMP_LABEL_PACKAGE_LEVEL;

  return model;
};
