import { DataTypes } from 'sequelize';
import { getBaseFields, getBaseOptions } from '../../../shared/db/base.model.js';
import {
  STAMP_VERIFICATION_ACTOR_TYPE,
  STAMP_VERIFICATION_CHANNEL,
  STAMP_VERIFICATION_RESULT,
} from '../constants/excise.enums.js';

export const ExciseStampVerification = (sequelize) => {
  const base = getBaseFields();
  const model = sequelize.define(
    'ExciseStampVerification',
    {
      ...base,
      organizationId: {
        ...base.organizationId,
        allowNull: true,
      },
      verificationNumber: {
        type: DataTypes.STRING(64),
        allowNull: false,
        field: 'verification_number',
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
      buyingProductName: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'buying_product_name',
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
      merchantName: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'merchant_name',
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
      shopInfoUpdateCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: 'shop_info_update_count',
      },
      shopInfoUpdatedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'shop_info_updated_at',
      },
      verifiedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'verified_at',
      },
    },
    {
      ...getBaseOptions('excise_stamp_verifications'),
      indexes: [
        {
          unique: true,
          fields: [{ name: 'verification_number' }],
          name: 'unique_excise_stamp_verification_number',
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
  };

  return model;
};
