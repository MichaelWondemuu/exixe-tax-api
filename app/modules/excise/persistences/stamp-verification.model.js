import { DataTypes } from 'sequelize';
import {
  STAMP_VERIFICATION_ACTOR_TYPE,
  STAMP_VERIFICATION_CHANNEL,
  STAMP_VERIFICATION_RESULT,
} from '../constants/excise.enums.js';

export const ExciseStampVerification = (sequelize) => {
  const model = sequelize.define(
    'ExciseStampVerification',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      verificationNumber: {
        type: DataTypes.STRING(64),
        allowNull: false,
        unique: true,
        field: 'verification_number',
      },
      organizationId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'organization_id',
      },
      facilityId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'facility_id',
      },
      actorType: {
        type: DataTypes.ENUM(...Object.values(STAMP_VERIFICATION_ACTOR_TYPE)),
        allowNull: false,
        field: 'actor_type',
      },
      channel: {
        type: DataTypes.ENUM(...Object.values(STAMP_VERIFICATION_CHANNEL)),
        allowNull: false,
        defaultValue: STAMP_VERIFICATION_CHANNEL.API,
        field: 'channel',
      },
      result: {
        type: DataTypes.ENUM(...Object.values(STAMP_VERIFICATION_RESULT)),
        allowNull: false,
        field: 'result',
      },
      stampIdentifier: {
        type: DataTypes.STRING(256),
        allowNull: false,
        field: 'stamp_identifier',
      },
      productDescription: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'product_description',
      },
      supplierName: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'supplier_name',
      },
      supplierDocumentType: {
        type: DataTypes.STRING(64),
        allowNull: true,
        field: 'supplier_document_type',
      },
      supplierDocumentNumber: {
        type: DataTypes.STRING(128),
        allowNull: true,
        field: 'supplier_document_number',
      },
      verificationEvidence: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {},
        field: 'verification_evidence',
      },
      remarks: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'remarks',
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
      tableName: 'excise_stamp_verifications',
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
