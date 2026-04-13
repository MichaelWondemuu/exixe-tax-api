import { DataTypes } from 'sequelize';
import { getBaseFields, getBaseOptions } from '../../../shared/db/base.model.js';

export const OrganizationDetail = (sequelize) => {
  const model = sequelize.define(
    'OrganizationDetail',
    {
      ...getBaseFields(),
      organizationId: {
        type: DataTypes.UUID,
        field: 'organization_id',
        allowNull: false,
        unique: true,
      },
      city: { type: DataTypes.STRING(255), allowNull: true },
      email: { type: DataTypes.STRING(255), allowNull: true },
      houseNumber: {
        type: DataTypes.STRING(64),
        field: 'house_number',
        allowNull: true,
      },
      legalName: {
        type: DataTypes.STRING(512),
        field: 'legal_name',
        allowNull: true,
      },
      locality: { type: DataTypes.STRING(255), allowNull: true },
      phone: { type: DataTypes.STRING(64), allowNull: true },
      region: { type: DataTypes.STRING(255), allowNull: true },
      subCity: {
        type: DataTypes.STRING(255),
        field: 'sub_city',
        allowNull: true,
      },
      tin: { type: DataTypes.STRING(64), allowNull: true },
      operatorType: {
        type: DataTypes.STRING(32),
        field: 'operator_type',
        allowNull: true,
      },
      operatorLicenseNumber: {
        type: DataTypes.STRING(128),
        field: 'operator_license_number',
        allowNull: true,
      },
      merchantId: {
        type: DataTypes.STRING(128),
        field: 'merchant_id',
        allowNull: true,
      },
      merchantName: {
        type: DataTypes.STRING(255),
        field: 'merchant_name',
        allowNull: true,
      },
      vatNumber: {
        type: DataTypes.STRING(64),
        field: 'vat_number',
        allowNull: true,
      },
      wereda: { type: DataTypes.STRING(255), allowNull: true },
      country: { type: DataTypes.STRING(10), allowNull: true },
      serialNumber: {
        type: DataTypes.STRING(128),
        field: 'serial_number',
        allowNull: true,
      },
      systemNumber: {
        type: DataTypes.STRING(128),
        field: 'system_number',
        allowNull: true,
      },
      systemType: {
        type: DataTypes.STRING(64),
        field: 'system_type',
        allowNull: true,
      },
      lastInvoiceCounter: {
        type: DataTypes.INTEGER,
        field: 'last_invoice_counter',
        allowNull: true,
      },
      lastInvoiceReferenceNumber: {
        type: DataTypes.STRING(128),
        field: 'last_invoice_reference_number',
        allowNull: true,
      },
      lastReceiptReferenceNumber: {
        type: DataTypes.STRING(128),
        field: 'last_receipt_reference_number',
        allowNull: true,
      },
    },
    {
      ...getBaseOptions('organization_details'),
    },
  );

  model.associate = (models) => {
    model.belongsTo(models.Organization, {
      foreignKey: 'organizationId',
      as: 'organization',
    });
  };

  return model;
};
