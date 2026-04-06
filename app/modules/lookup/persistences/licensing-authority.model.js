import { DataTypes } from 'sequelize';

/**
 * Lookup: licensing authority (e.g. "Regional Trade Bureaus (RTB)").
 * Table: lookup_licensing_authorities
 */
export const LicensingAuthority = (sequelize) => {
  const model = sequelize.define(
    'LicensingAuthority',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        field: 'name',
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
      tableName: 'lookup_licensing_authorities',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: true,
    },
  );
  model.ignoreOrganizationFilter = true;
  return model;
};
