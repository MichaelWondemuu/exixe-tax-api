import { DataTypes } from 'sequelize';

/**
 * Lookup: verification body (e.g. "Ministry of Agriculture (MOA)").
 * Table: lookup_verification_bodies
 */
export const VerificationBody = (sequelize) => {
  const model = sequelize.define(
    'VerificationBody',
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
      tableName: 'lookup_verification_bodies',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: true,
    },
  );
  model.ignoreOrganizationFilter = true;
  return model;
};
