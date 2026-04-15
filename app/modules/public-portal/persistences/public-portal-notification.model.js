import { DataTypes } from 'sequelize';

export const PublicPortalNotification = (sequelize) => {
  const model = sequelize.define(
    'PublicPortalNotification',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      reporterId: {
        type: DataTypes.STRING(128),
        allowNull: true,
        field: 'reporter_id',
      },
      type: {
        type: DataTypes.STRING(64),
        allowNull: false,
        field: 'type',
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'title',
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: false,
        field: 'message',
      },
      payload: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {},
        field: 'payload',
      },
      isRead: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: 'is_read',
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'created_at',
      },
    },
    {
      sequelize,
      tableName: 'public_portal_notifications',
      timestamps: false,
      underscored: true,
    },
  );

  model.ignoreOrganizationFilter = true;
  return model;
};
