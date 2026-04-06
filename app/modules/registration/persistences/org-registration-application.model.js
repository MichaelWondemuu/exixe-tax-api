import { DataTypes } from 'sequelize';

const STATUSES = ['PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'];

/**
 * Self-service organization registration application (pre-account).
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
      status: {
        type: DataTypes.STRING(32),
        allowNull: false,
        defaultValue: 'PENDING',
        validate: {
          isIn: [STATUSES],
        },
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
      details: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      reviewNote: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'review_note',
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
  };

  return model;
};
