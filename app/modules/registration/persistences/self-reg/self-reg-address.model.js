import { DataTypes } from 'sequelize';

/**
 * Reusable postal / geographic address (self-registration domain).
 * Linked via SelfRegOrganizationAddress or SelfRegFacility.siteAddress.
 */
export const SelfRegAddress = (sequelize) => {
  const model = sequelize.define(
    'SelfRegAddress',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      country: { type: DataTypes.STRING(128), allowNull: true },
      region: { type: DataTypes.STRING(128), allowNull: true },
      city: { type: DataTypes.STRING(128), allowNull: true },
      subcity: { type: DataTypes.STRING(128), allowNull: true },
      woreda: { type: DataTypes.STRING(128), allowNull: true },
      houseNumber: {
        type: DataTypes.STRING(64),
        allowNull: true,
        field: 'house_number',
      },
      latitude: { type: DataTypes.DECIMAL(10, 7), allowNull: true },
      longitude: { type: DataTypes.DECIMAL(10, 7), allowNull: true },
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
      tableName: 'self_reg_addresses',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  );

  model.ignoreOrganizationFilter = true;

  return model;
};
