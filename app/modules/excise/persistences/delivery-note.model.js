import { DataTypes } from 'sequelize';
import { getBaseFields, getBaseOptions } from '../../../shared/db/base.model.js';
import { DELIVERY_NOTE_STATUS } from '../constants/excise.enums.js';

export const ExciseDeliveryNote = (sequelize) => {
  const base = getBaseFields();
  const model = sequelize.define(
    'ExciseDeliveryNote',
    {
      ...base,
      organizationId: {
        ...base.organizationId,
        allowNull: true,
      },
      noteNumber: {
        type: DataTypes.STRING(64),
        allowNull: false,
        field: 'note_number',
      },
      fromFacilityId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'from_facility_id',
      },
      toFacilityId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'to_facility_id',
      },
      shipmentRoute: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'shipment_route',
      },
      transporterName: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'transporter_name',
      },
      vehiclePlateNo: {
        type: DataTypes.STRING(64),
        allowNull: true,
        field: 'vehicle_plate_no',
      },
      expectedDispatchAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'expected_dispatch_at',
      },
      expectedArrivalAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'expected_arrival_at',
      },
      status: {
        type: DataTypes.ENUM(...Object.values(DELIVERY_NOTE_STATUS)),
        allowNull: false,
        defaultValue: DELIVERY_NOTE_STATUS.DRAFT,
        field: 'status',
      },
      items: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: [],
        field: 'items',
      },
      remarks: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'remarks',
      },
      approvedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'approved_at',
      },
      dispatchedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'dispatched_at',
      },
      receivedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'received_at',
      },
    },
    {
      ...getBaseOptions('excise_delivery_notes'),
      indexes: [
        {
          unique: true,
          fields: [{ name: 'note_number' }],
          name: 'unique_excise_delivery_note_number',
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
      foreignKey: 'fromFacilityId',
      as: 'fromFacility',
    });
    model.belongsTo(models.ExciseFacility, {
      foreignKey: 'toFacilityId',
      as: 'toFacility',
    });
  };

  return model;
};
