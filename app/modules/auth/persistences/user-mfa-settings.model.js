import { DataTypes } from 'sequelize';
import { getBaseFields, getBaseOptions } from '../../../shared/db/base.model.js';

export const UserMfaSettings = (sequelize) => {
  const model = sequelize.define(
    'UserMfaSettings',
    {
      ...getBaseFields(),
      phone: {
        type: DataTypes.STRING(255),
        allowNull: false,
        // unique: true, // Removed - using unique index instead (see indexes below)
        comment:
          'Phone number - MFA settings are shared across users with same phone',
      },
      userId: {
        type: DataTypes.UUID,
        field: 'user_id',
        allowNull: true,
        comment:
          'Reference to one of the users with this phone (for association)',
      },
      smsOtpEnabled: {
        type: DataTypes.BOOLEAN,
        field: 'sms_otp_enabled',
        allowNull: false,
        defaultValue: false,
        comment: 'Whether SMS OTP is enabled for this user',
      },
      totpEnabled: {
        type: DataTypes.BOOLEAN,
        field: 'totp_enabled',
        allowNull: false,
        defaultValue: false,
        comment: 'Whether TOTP (Google Authenticator) is enabled for this user',
      },
      totpSecret: {
        type: DataTypes.STRING(255),
        field: 'totp_secret',
        allowNull: true,
        comment: 'Encrypted TOTP secret (base32 encoded)',
      },
      totpBackupCodes: {
        type: DataTypes.TEXT,
        field: 'totp_backup_codes',
        allowNull: true,
        comment: 'JSON array of hashed backup codes',
      },
      // Organization IDs where MFA is required for this user/phone. Configure once, then add orgs when logging in with other orgs.
      mfaEnabledOrganizationIds: {
        type: DataTypes.JSONB,
        field: 'mfa_enabled_organization_ids',
        allowNull: true,
        defaultValue: [],
        comment: 'Array of organization IDs where MFA is required (string[])',
      },
    },
    {
      ...getBaseOptions('user_mfa_settings'),
      indexes: [
        {
          unique: true,
          fields: ['phone'],
          name: 'unique_phone_mfa_settings',
        },
        {
          fields: ['user_id'],
          name: 'idx_mfa_settings_user_id',
        },
      ],
    }
  );

  model.associate = (models) => {
    // UserMfaSettings -> User (Many-to-One via userId reference)
    // Note: MFA settings are shared by phone, userId is just a reference
    model.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
      required: false,
    });
  };

  return model;
};
