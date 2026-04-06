import { DataTypes } from 'sequelize';
import { getBaseFields, getBaseOptions } from '../../../shared/db/base.model.js';

export const OtpCode = (sequelize) => {
  const model = sequelize.define(
    'OtpCode',
    {
      ...getBaseFields(),
      userId: {
        type: DataTypes.UUID,
        field: 'user_id',
        allowNull: false,
        comment: 'User who requested the OTP',
      },
      code: {
        type: DataTypes.STRING(10),
        allowNull: false,
        comment: 'OTP code (hashed)',
      },
      expiresAt: {
        type: DataTypes.DATE,
        field: 'expires_at',
        allowNull: false,
        comment: 'OTP expiration timestamp',
      },
      used: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Whether this OTP has been used',
      },
      usedAt: {
        type: DataTypes.DATE,
        field: 'used_at',
        allowNull: true,
        comment: 'Timestamp when OTP was used',
      },
      purpose: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'login',
        comment: 'Purpose of OTP: login, password_reset, etc.',
      },
    },
    {
      ...getBaseOptions('otp_codes'),
      indexes: [
        {
          fields: ['user_id', 'used', 'expires_at'],
          name: 'idx_otp_user_used_expires',
        },
        {
          fields: ['expires_at'],
          name: 'idx_otp_expires_at',
        },
      ],
    }
  );

  model.associate = (models) => {
    // OtpCode -> User (Many-to-One)
    model.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    });
  };

  return model;
};
