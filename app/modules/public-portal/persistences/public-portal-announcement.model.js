import { DataTypes } from 'sequelize';

export const PublicPortalAnnouncement = (sequelize) => {
  const model = sequelize.define(
    'PublicPortalAnnouncement',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      code: {
        type: DataTypes.STRING(64),
        allowNull: true,
        unique: true,
        field: 'code',
      },
      category: {
        type: DataTypes.STRING(64),
        allowNull: false,
        field: 'category',
      },
      priority: {
        type: DataTypes.STRING(32),
        allowNull: false,
        defaultValue: 'MEDIUM',
        field: 'priority',
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
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: 'is_active',
      },
      publishedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'published_at',
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
      tableName: 'public_portal_announcements',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: true,
    },
  );

  model.ignoreOrganizationFilter = true;
  return model;
};
