import { DataTypes } from 'sequelize';
import { COUNTERFEIT_CASE_STATUS } from '../constants/enforcement.enums.js';

export const CounterfeitCase = (sequelize) => {
  const model = sequelize.define(
    'CounterfeitCase',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      title: {
        type: DataTypes.STRING(500),
        allowNull: false,
        field: 'title',
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'description',
      },
      subjectOrganizationId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'subject_organization_id',
      },
      status: {
        type: DataTypes.ENUM(...Object.values(COUNTERFEIT_CASE_STATUS)),
        allowNull: false,
        defaultValue: COUNTERFEIT_CASE_STATUS.OPEN,
        field: 'status',
      },
      createdByUserId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'created_by_user_id',
      },
      assignedToUserId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'assigned_to_user_id',
      },
      sourceCounterfeitReportId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'source_counterfeit_report_id',
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
      tableName: 'counterfeit_cases',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: true,
    },
  );

  model.ignoreOrganizationFilter = true;

  model.associate = (models) => {
    model.belongsTo(models.User, {
      foreignKey: 'createdByUserId',
      as: 'createdBy',
    });
    model.belongsTo(models.User, {
      foreignKey: 'assignedToUserId',
      as: 'assignedTo',
    });
    model.belongsTo(models.Organization, {
      foreignKey: 'subjectOrganizationId',
      as: 'subjectOrganization',
    });
    model.belongsTo(models.CounterfeitReport, {
      foreignKey: 'sourceCounterfeitReportId',
      as: 'sourceReport',
    });
    model.belongsToMany(models.ExciseStampVerification, {
      through: models.CounterfeitCaseStampVerification,
      foreignKey: 'counterfeitCaseId',
      otherKey: 'exciseStampVerificationId',
      as: 'stampVerifications',
    });
  };

  return model;
};
