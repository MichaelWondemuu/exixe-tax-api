import { DataTypes } from 'sequelize';

export const SelfRegStandard = (sequelize) => {
  const model = sequelize.define(
    'SelfRegStandard',
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
      standardName: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'standard_name',
      },
      certificateNumber: {
        type: DataTypes.STRING(128),
        allowNull: true,
        field: 'certificate_number',
      },
      expiryDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        field: 'expiry_date',
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
      tableName: 'self_reg_standards',
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
