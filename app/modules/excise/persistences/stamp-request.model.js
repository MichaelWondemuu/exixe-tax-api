import { DataTypes } from 'sequelize';
import {
  STAMP_PAYMENT_STATUS,
  STAMP_REQUEST_STATUS,
} from '../constants/excise.enums.js';

export const ExciseStampRequest = (sequelize) => {
  const model = sequelize.define(
    'ExciseStampRequest',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      requestNumber: {
        type: DataTypes.STRING(64),
        allowNull: false,
        unique: true,
        field: 'request_number',
      },
      organizationId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'organization_id',
      },
      facilityId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'facility_id',
      },
      goodsCategory: {
        type: DataTypes.STRING(128),
        allowNull: false,
        field: 'goods_category',
      },
      goodsDescription: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'goods_description',
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'quantity',
      },
      stampFeeAmount: {
        type: DataTypes.DECIMAL(18, 2),
        allowNull: true,
        field: 'stamp_fee_amount',
      },
      stampFeeCurrency: {
        type: DataTypes.STRING(8),
        allowNull: true,
        defaultValue: 'ETB',
        field: 'stamp_fee_currency',
      },
      paymentStatus: {
        type: DataTypes.ENUM(...Object.values(STAMP_PAYMENT_STATUS)),
        allowNull: false,
        defaultValue: STAMP_PAYMENT_STATUS.UNPAID,
        field: 'payment_status',
      },
      paymentReference: {
        type: DataTypes.STRING(128),
        allowNull: true,
        field: 'payment_reference',
      },
      paymentProofUrl: {
        type: DataTypes.STRING(500),
        allowNull: true,
        field: 'payment_proof_url',
      },
      paidAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'paid_at',
      },
      requiredByDate: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'required_by_date',
      },
      plannedProductionOrImportDate: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'planned_production_or_import_date',
      },
      status: {
        type: DataTypes.ENUM(...Object.values(STAMP_REQUEST_STATUS)),
        allowNull: false,
        defaultValue: STAMP_REQUEST_STATUS.DRAFT,
        field: 'status',
      },
      attachmentUrl: {
        type: DataTypes.STRING(500),
        allowNull: true,
        field: 'attachment_url',
      },
      rejectionReason: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'rejection_reason',
      },
      approvedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'approved_at',
      },
      submittedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'submitted_at',
      },
      reviewDueAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'review_due_at',
      },
      reviewedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'reviewed_at',
      },
      reviewedByUserId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'reviewed_by_user_id',
      },
      reviewSlaBreached: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: 'review_sla_breached',
      },
      fulfilledAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'fulfilled_at',
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
      tableName: 'excise_stamp_requests',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: true,
    },
  );

  model.associate = (models) => {
    model.belongsTo(models.Organization, {
      foreignKey: 'organizationId',
      as: 'organization',
    });
    model.belongsTo(models.ExciseFacility, {
      foreignKey: 'facilityId',
      as: 'facility',
    });
  };

  return model;
};
