import { DataTypes } from 'sequelize';
import { APPROVAL_LOG_ACTIONS } from '../../constants/self-registration.enums.js';

/**
 * Domain audit for registration workflow (distinct from HTTP AuditLog).
 * Actions: SUBMITTED, REVIEWED, APPROVED, REJECTED.
 */
export const OrgRegistrationApprovalLog = (sequelize) => {
  const model = sequelize.define(
    'OrgRegistrationApprovalLog',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      applicationId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'application_id',
      },
      action: {
        type: DataTypes.STRING(32),
        allowNull: false,
        validate: { isIn: [APPROVAL_LOG_ACTIONS] },
      },
      actorUserId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'actor_user_id',
      },
      meta: { type: DataTypes.JSONB, allowNull: true },
      createdAt: {
        type: DataTypes.DATE,
        field: 'created_at',
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      tableName: 'org_registration_approval_logs',
      underscored: true,
      timestamps: true,
      updatedAt: false,
      createdAt: 'created_at',
    },
  );

  model.ignoreOrganizationFilter = true;

  model.associate = (models) => {
    model.belongsTo(models.OrgRegistrationApplication, {
      foreignKey: 'application_id',
      as: 'application',
    });
  };

  return model;
};
