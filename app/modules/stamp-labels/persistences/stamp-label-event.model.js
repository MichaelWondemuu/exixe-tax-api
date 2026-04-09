import { DataTypes } from 'sequelize';

export const StampLabelEvent = (sequelize) => {
  const model = sequelize.define(
    'StampLabelEvent',
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
      stampLabelId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'stamp_label_id',
      },
      stampUid: {
        type: DataTypes.STRING(128),
        allowNull: false,
        field: 'stamp_uid',
      },
      eventType: {
        type: DataTypes.STRING(32),
        allowNull: false,
        field: 'event_type',
      },
      fromStatus: {
        type: DataTypes.STRING(32),
        allowNull: true,
        field: 'from_status',
      },
      toStatus: {
        type: DataTypes.STRING(32),
        allowNull: true,
        field: 'to_status',
      },
      actorType: {
        type: DataTypes.STRING(32),
        allowNull: true,
        field: 'actor_type',
      },
      actorId: {
        type: DataTypes.STRING(128),
        allowNull: true,
        field: 'actor_id',
      },
      actorName: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'actor_name',
      },
      locationCode: {
        type: DataTypes.STRING(128),
        allowNull: true,
        field: 'location_code',
      },
      verificationChannel: {
        type: DataTypes.STRING(32),
        allowNull: true,
        field: 'verification_channel',
      },
      verificationResult: {
        type: DataTypes.STRING(32),
        allowNull: true,
        field: 'verification_result',
      },
      payload: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {},
        field: 'payload',
      },
      occurredAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'occurred_at',
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
      tableName: 'stamp_label_events',
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
    model.belongsTo(models.StampLabel, {
      foreignKey: 'stampLabelId',
      as: 'stampLabel',
    });
  };

  return model;
};
