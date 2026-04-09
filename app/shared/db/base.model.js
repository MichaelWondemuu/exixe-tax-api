import { DataTypes } from 'sequelize';
import { sequelize } from './database.js';

export const getBaseFields = () => ({
  id: {
    //     type: DataTypes.INTEGER,
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
  },
  organizationId: {
    type: DataTypes.UUID,
    field: 'organization_id',
    allowNull: false,
    references: {
      model: 'organizations',
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
  },
  organizationName: {
    type: DataTypes.STRING(255),
    field: 'organization_name',
    allowNull: true,
  },
  createdAt: {
    type: DataTypes.DATE,
    field: 'created_at',
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  // createdBy: {
  //   type: DataTypes.UUID,
  //   field: 'created_by',
  //   allowNull: true,
  // },
  // updatedBy: {
  //   type: DataTypes.UUID,
  //   field: 'updated_by',
  //   allowNull: true,
  // },
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
});

export const getBaseOptions = (tableName) => ({
  sequelize,
  tableName,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  paranoid: true,
  deletedAt: 'deleted_at',
  underscored: true,
});

