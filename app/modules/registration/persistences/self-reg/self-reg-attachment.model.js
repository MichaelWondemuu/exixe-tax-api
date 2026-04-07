import { DataTypes } from 'sequelize';
import { ATTACHMENT_ENTITY_TYPES } from '../../constants/self-registration.enums.js';

export const SelfRegAttachment = (sequelize) => {
  const model = sequelize.define(
    'SelfRegAttachment',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      organizationId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'organization_id',
      },
      entityType: {
        type: DataTypes.STRING(32),
        allowNull: false,
        field: 'entity_type',
        validate: { isIn: [ATTACHMENT_ENTITY_TYPES] },
      },
      entityId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'entity_id',
      },
      fileName: {
        type: DataTypes.STRING(512),
        allowNull: false,
        field: 'file_name',
      },
      fileUrl: {
        type: DataTypes.TEXT,
        allowNull: false,
        field: 'file_url',
      },
      fileType: {
        type: DataTypes.STRING(128),
        allowNull: true,
        field: 'file_type',
      },
      createdAt: {
        type: DataTypes.DATE,
        field: 'created_at',
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        field: 'updated_at',
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      tableName: 'self_reg_attachments',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  );

  model.ignoreOrganizationFilter = true;

  model.associate = (models) => {
    model.belongsTo(models.SelfRegOrganization, {
      foreignKey: 'organization_id',
      as: 'organization',
    });
  };

  return model;
};
