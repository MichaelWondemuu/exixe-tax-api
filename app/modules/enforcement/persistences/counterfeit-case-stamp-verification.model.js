import { DataTypes } from 'sequelize';

export const CounterfeitCaseStampVerification = (sequelize) => {
  const model = sequelize.define(
    'CounterfeitCaseStampVerification',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      counterfeitCaseId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'counterfeit_case_id',
      },
      exciseStampVerificationId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'excise_stamp_verification_id',
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
      tableName: 'counterfeit_case_stamp_verifications',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: true,
      indexes: [
        {
          unique: true,
          fields: ['counterfeit_case_id', 'excise_stamp_verification_id'],
        },
      ],
    },
  );

  model.ignoreOrganizationFilter = true;

  model.associate = (models) => {
    model.belongsTo(models.CounterfeitCase, {
      foreignKey: 'counterfeitCaseId',
      as: 'counterfeitCase',
    });
    model.belongsTo(models.ExciseStampVerification, {
      foreignKey: 'exciseStampVerificationId',
      as: 'stampVerification',
    });
  };

  return model;
};
