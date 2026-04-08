import { DataTypes } from 'sequelize';

export const Predeclaration = (sequelize) => {
  const model = sequelize.define(
    'Predeclaration',
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
      referenceNo: {
        type: DataTypes.STRING(64),
        allowNull: false,
        unique: true,
        field: 'reference_no',
      },
      declarationDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        field: 'declaration_date',
      },
      status: {
        type: DataTypes.ENUM(
          'DRAFT',
          'SUBMITTED',
          'APPROVED',
          'REJECTED',
          'CANCELLED',
        ),
        allowNull: false,
        defaultValue: 'DRAFT',
        field: 'status',
      },
      remarks: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'remarks',
      },
      submittedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'submitted_at',
      },
      approvedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'approved_at',
      },
      rejectedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'rejected_at',
      },
      cancelledAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'cancelled_at',
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
      tableName: 'predeclarations',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: true,
    },
  );

  model.associate = (models) => {
    model.hasMany(models.PredeclarationItem, {
      foreignKey: 'predeclarationId',
      as: 'items',
      onDelete: 'CASCADE',
      hooks: true,
    });
  };

  return model;
};
