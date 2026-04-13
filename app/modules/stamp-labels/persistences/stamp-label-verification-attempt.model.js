import { DataTypes } from 'sequelize';

export const StampLabelVerificationAttempt = (sequelize) => {
  const model = sequelize.define(
    'StampLabelVerificationAttempt',
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
        allowNull: true,
        field: 'stamp_label_id',
      },
      stampUid: {
        type: DataTypes.STRING(128),
        allowNull: false,
        field: 'stamp_uid',
      },
      channel: {
        type: DataTypes.STRING(32),
        allowNull: true,
        field: 'channel',
      },
      result: {
        type: DataTypes.STRING(32),
        allowNull: false,
        field: 'result',
      },
      stampStatus: {
        type: DataTypes.STRING(32),
        allowNull: true,
        field: 'stamp_status',
      },
      locationCode: {
        type: DataTypes.STRING(128),
        allowNull: true,
        field: 'location_code',
      },
      inspectorBadge: {
        type: DataTypes.STRING(128),
        allowNull: true,
        field: 'inspector_badge',
      },
      remarks: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'remarks',
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
      metadata: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {},
        field: 'metadata',
      },
      verifiedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'verified_at',
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
      tableName: 'stamp_label_verification_attempts',
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
