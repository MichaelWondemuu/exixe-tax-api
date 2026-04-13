import { DataTypes } from 'sequelize';
import { getBaseFields, getBaseOptions } from '../../../shared/db/base.model.js';
import {
  STAMP_STOCK_EVENT_STATUS,
  STAMP_STOCK_EVENT_TYPE,
} from '../constants/excise.enums.js';

export const ExciseStampStockEvent = (sequelize) => {
  const base = getBaseFields();
  const model = sequelize.define(
    'ExciseStampStockEvent',
    {
      ...base,
      organizationId: {
        ...base.organizationId,
        allowNull: true,
      },
      eventNumber: {
        type: DataTypes.STRING(64),
        allowNull: false,
        field: 'event_number',
      },
      eventType: {
        type: DataTypes.ENUM(...Object.values(STAMP_STOCK_EVENT_TYPE)),
        allowNull: false,
        field: 'event_type',
      },
      status: {
        type: DataTypes.ENUM(...Object.values(STAMP_STOCK_EVENT_STATUS)),
        allowNull: false,
        defaultValue: STAMP_STOCK_EVENT_STATUS.DRAFT,
        field: 'status',
      },
      relatedStampRequestId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'related_stamp_request_id',
      },
      sourceFacilityId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'source_facility_id',
      },
      targetFacilityId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'target_facility_id',
      },
      reasonCode: {
        type: DataTypes.STRING(64),
        allowNull: false,
        field: 'reason_code',
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'quantity',
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'notes',
      },
      evidenceUrl: {
        type: DataTypes.STRING(500),
        allowNull: true,
        field: 'evidence_url',
      },
      requestedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'requested_at',
      },
      approvedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'approved_at',
      },
      approvedByUserId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'approved_by_user_id',
      },
      completedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'completed_at',
      },
      rejectionReason: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'rejection_reason',
      },
      meta: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {},
        field: 'meta',
      },
    },
    {
      ...getBaseOptions('excise_stamp_stock_events'),
      indexes: [
        {
          unique: true,
          fields: [{ name: 'event_number' }],
          name: 'unique_excise_stamp_stock_event_number',
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
      foreignKey: 'sourceFacilityId',
      as: 'sourceFacility',
    });
    model.belongsTo(models.ExciseFacility, {
      foreignKey: 'targetFacilityId',
      as: 'targetFacility',
    });
    model.belongsTo(models.ExciseStampRequest, {
      foreignKey: 'relatedStampRequestId',
      as: 'relatedStampRequest',
    });
  };

  return model;
};
