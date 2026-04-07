import { DataTypes } from 'sequelize';

/**
 * Lookup: measurement unit.
 * Table: lookup_measurements
 */
export const Measurement = (sequelize) => {
  const model = sequelize.define(
    'Measurement',
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
      shortForm: {
        type: DataTypes.STRING(50),
        allowNull: true,
        unique: true,
        field: 'short_form',
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
      tableName: 'lookup_measurements',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: true,
    },
  );

  model.ignoreOrganizationFilter = true;
  return model;
};
