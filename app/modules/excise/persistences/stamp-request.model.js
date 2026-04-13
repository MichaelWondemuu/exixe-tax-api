import { DataTypes } from 'sequelize';
import { getBaseFields, getBaseOptions } from '../../../shared/db/base.model.js';
import {
  STAMP_PAYMENT_STATUS,
  STAMP_REQUEST_STATUS,
} from '../constants/excise.enums.js';

export const ExciseStampRequest = (sequelize) => {
  const base = getBaseFields();
  const model = sequelize.define(
    'ExciseStampRequest',
    {
      ...base,
      organizationId: {
        ...base.organizationId,
        allowNull: true,
      },
      requestNumber: {
        type: DataTypes.STRING(64),
        allowNull: false,
        field: 'request_number',
      },
      facilityId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'facility_id',
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
      variantId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'variant_id',
      },
      variantName: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'variant_name',
      },
      uomId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'uom_id',
      },
      uomName: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'uom_name',
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
      generatedQuantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: 'generated_quantity',
        comment: 'Count of stamp labels generated for this request (capped at quantity)',
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
    },
    {
      ...getBaseOptions('excise_stamp_requests'),
      indexes: [
        {
          unique: true,
          fields: [{ name: 'request_number' }],
          name: 'unique_excise_stamp_request_number',
        },
      ],
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
    model.belongsTo(models.Product, {
      foreignKey: 'productId',
      as: 'product',
    });
    model.belongsTo(models.ProductVariant, {
      foreignKey: 'variantId',
      as: 'variant',
    });
    model.belongsTo(models.Measurement, {
      foreignKey: 'uomId',
      as: 'uom',
    });
  };

  return model;
};
