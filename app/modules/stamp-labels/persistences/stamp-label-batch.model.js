import { DataTypes } from 'sequelize';
import { STAMP_LABEL_BATCH_STATUS } from '../constants/stamp-labels.enums.js';

export const StampLabelBatch = (sequelize) => {
  const model = sequelize.define(
    'StampLabelBatch',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      organizationId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'organization_id',
      },
      batchNumber: {
        type: DataTypes.STRING(128),
        allowNull: false,
        unique: true,
        field: 'batch_number',
      },
      status: {
        type: DataTypes.STRING(32),
        allowNull: false,
        defaultValue: STAMP_LABEL_BATCH_STATUS.GENERATED,
        field: 'status',
      },
      totalCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: 'total_count',
      },
      generatedCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: 'generated_count',
      },
      issuedCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: 'issued_count',
      },
      printedCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: 'printed_count',
      },
      printedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'printed_at',
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'notes',
      },
      metadata: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {},
        field: 'metadata',
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
      tableName: 'stamp_label_batches',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: true,
    },
  );

  model.associate = (models) => {
    model.belongsTo(models.Organization, {
      foreignKey: 'organizationId',
      as: 'organization',
    });
    model.hasMany(models.StampLabel, {
      foreignKey: 'batchId',
      as: 'stamps',
    });
  };

  return model;
};
