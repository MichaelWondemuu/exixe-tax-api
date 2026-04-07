import { DataTypes } from 'sequelize';
import { ADDRESS_PURPOSES } from '../../constants/self-registration.enums.js';

/** Junction: organization ↔ address with HQ / LEGAL / BILLING role. */
export const SelfRegOrganizationAddress = (sequelize) => {
  const model = sequelize.define(
    'SelfRegOrganizationAddress',
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
      addressId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'address_id',
      },
      purpose: {
        type: DataTypes.STRING(16),
        allowNull: false,
        validate: { isIn: [ADDRESS_PURPOSES] },
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
      tableName: 'self_reg_organization_addresses',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [{ unique: true, fields: ['organization_id', 'purpose'] }],
    },
  );

  model.ignoreOrganizationFilter = true;

  model.associate = (models) => {
    model.belongsTo(models.SelfRegOrganization, {
      foreignKey: 'organization_id',
      as: 'organization',
    });
    model.belongsTo(models.SelfRegAddress, {
      foreignKey: 'address_id',
      as: 'address',
    });
  };

  return model;
};
