import { DataTypes } from 'sequelize';

export const LoginBan = (sequelize) => {
  const model = sequelize.define(
    'LoginBan',
    {
      phone: {
        type: DataTypes.STRING(32),
        primaryKey: true,
        allowNull: false,
      },
      failedAttempts: {
        type: DataTypes.INTEGER,
        field: 'failed_attempts',
        allowNull: false,
        defaultValue: 0,
      },
      lockedUntil: {
        type: DataTypes.DATE,
        field: 'locked_until',
        allowNull: true,
      },
      permanentBanned: {
        type: DataTypes.BOOLEAN,
        field: 'permanent_banned',
        allowNull: false,
        defaultValue: false,
      },
      banReason: {
        type: DataTypes.TEXT,
        field: 'ban_reason',
        allowNull: true,
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
      tableName: 'auth_login_bans',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: true,
    },
  );

  return model;
};
