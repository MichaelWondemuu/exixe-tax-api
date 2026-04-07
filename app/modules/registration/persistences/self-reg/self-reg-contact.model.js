import { DataTypes } from 'sequelize';

/** CEO / responsible persons for the self-registration organization. */
export const SelfRegContact = (sequelize) => {
  const model = sequelize.define(
    'SelfRegContact',
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
      fullName: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'full_name',
      },
      role: { type: DataTypes.STRING(64), allowNull: false },
      phone: { type: DataTypes.STRING(64), allowNull: true },
      email: { type: DataTypes.STRING(255), allowNull: true },
      nationalId: {
        type: DataTypes.STRING(64),
        allowNull: true,
        field: 'national_id',
      },
      isPrimary: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: 'is_primary',
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
      tableName: 'self_reg_contacts',
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
