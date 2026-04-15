import { DataTypes } from 'sequelize';

export const PublicPortalReport = (sequelize) => {
  const model = sequelize.define(
    'PublicPortalReport',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      reference: {
        type: DataTypes.STRING(64),
        allowNull: false,
        unique: true,
        field: 'reference',
      },
      reportType: {
        type: DataTypes.STRING(64),
        allowNull: false,
        field: 'report_type',
      },
      stampUid: {
        type: DataTypes.STRING(128),
        allowNull: true,
        field: 'stamp_uid',
      },
      channel: {
        type: DataTypes.STRING(32),
        allowNull: true,
        field: 'channel',
      },
      productName: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'product_name',
      },
      address: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'address',
      },
      city: {
        type: DataTypes.STRING(128),
        allowNull: true,
        field: 'city',
      },
      region: {
        type: DataTypes.STRING(128),
        allowNull: true,
        field: 'region',
      },
      woreda: {
        type: DataTypes.STRING(128),
        allowNull: true,
        field: 'woreda',
      },
      latitude: {
        type: DataTypes.DECIMAL(10, 7),
        allowNull: true,
        field: 'latitude',
      },
      longitude: {
        type: DataTypes.DECIMAL(10, 7),
        allowNull: true,
        field: 'longitude',
      },
      location: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'location',
      },
      comments: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'comments',
      },
      photos: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: [],
        field: 'photos',
      },
      reporterName: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'reporter_name',
      },
      reporterContact: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'reporter_contact',
      },
      reporterId: {
        type: DataTypes.STRING(128),
        allowNull: true,
        field: 'reporter_id',
      },
      status: {
        type: DataTypes.STRING(64),
        allowNull: false,
        defaultValue: 'SUBMITTED',
        field: 'status',
      },
      timeline: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: [],
        field: 'timeline',
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
      tableName: 'public_portal_reports',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: true,
    },
  );

  model.ignoreOrganizationFilter = true;
  return model;
};
