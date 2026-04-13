import { DataTypes } from 'sequelize';
import { getBaseFields, getBaseOptions } from '../../../shared/db/base.model.js';

export const OtpSendCooldown = (sequelize) => {
  const model = sequelize.define(
    'OtpSendCooldown',
    {
      ...getBaseFields(),
      phone: {
        type: DataTypes.STRING(30),
        allowNull: false,
        comment: 'Normalized phone number for OTP send rate limiting',
      },
      lastSentAt: {
        type: DataTypes.DATE,
        field: 'last_sent_at',
        allowNull: false,
      },
      nextAllowedAt: {
        type: DataTypes.DATE,
        field: 'next_allowed_at',
        allowNull: false,
      },
    },
    {
      ...getBaseOptions('otp_send_cooldowns'),
      indexes: [
        {
          unique: true,
          fields: ['phone'],
          name: 'unique_otp_send_cooldown_phone',
        },
      ],
    },
  );

  // Cooldown is global by phone; do not scope by organization.
  model.ignoreOrganizationFilter = true;

  return model;
};

