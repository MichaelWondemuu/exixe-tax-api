import { DataTypes } from 'sequelize';

const STATUSES = ['PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'];

/**
 * Self-service organization registration application (pre-account).
 * Serves as the approval / workflow envelope (spec "ApprovalRequest").
 * Table: org_registration_applications
 */
export const OrgRegistrationApplication = (sequelize) => {
  const model = sequelize.define(
    'OrgRegistrationApplication',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      tin: {
        type: DataTypes.STRING(64),
        allowNull: true,
        unique: true,
      },
      organizationType: {
        type: DataTypes.STRING(32),
        allowNull: true,
        field: 'organization_type',
      },
      registrationNumber: {
        type: DataTypes.STRING(128),
        allowNull: true,
        field: 'registration_number',
      },
      submittedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'submitted_at',
      },
      reviewedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'reviewed_at',
      },
      reviewedByUserId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'reviewed_by_user_id',
      },
      rejectionReason: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'rejection_reason',
      },
      status: {
        type: DataTypes.STRING(32),
        allowNull: false,
        defaultValue: 'PENDING',
        validate: {
          isIn: [STATUSES],
        },
      },
      reference: {
        type: DataTypes.STRING(48),
        allowNull: true,
        unique: true,
      },
      legalName: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'legal_name',
      },
      businessTypeId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'business_type_id',
      },
      contactEmail: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'contact_email',
      },
      contactPhone: {
        type: DataTypes.STRING(64),
        allowNull: true,
        field: 'contact_phone',
      },
      tinNumber: {
        type: DataTypes.STRING(64),
        allowNull: true,
        field: 'tin_number',
      },
      details: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      reviewNote: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'review_note',
      },
      adjustmentHistory: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: [],
        field: 'adjustment_history',
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
      deletedAt: {
        type: DataTypes.DATE,
        field: 'deleted_at',
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: 'org_registration_applications',
      timestamps: true,
      paranoid: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
      underscored: true,
    },
  );

  model.ignoreOrganizationFilter = true;

  model.associate = (models) => {
    model.belongsTo(models.BusinessType, {
      foreignKey: 'business_type_id',
      as: 'businessType',
    });
    model.hasOne(models.SelfRegOrganization, {
      foreignKey: 'application_id',
      as: 'registrationOrganization',
    });
    model.hasMany(models.OrgRegistrationApprovalLog, {
      foreignKey: 'application_id',
      as: 'approvalLogs',
    });
  };

  return model;
};
