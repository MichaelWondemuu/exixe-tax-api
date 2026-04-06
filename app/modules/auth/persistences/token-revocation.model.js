import { DataTypes } from 'sequelize';
import { getBaseFields, getBaseOptions } from '../../../shared/db/base.model.js';

/**
 * TokenRevocation
 *
 * Stores JWT `jti` values that should be rejected until `expires_at`.
 * This enables "instant logout" by blacklisting access + refresh tokens.
 */
export const TokenRevocation = (sequelize) => {
  const model = sequelize.define(
    'TokenRevocation',
    {
      ...getBaseFields(),

      userId: {
        type: DataTypes.UUID,
        field: 'user_id',
        allowNull: false,
      },

      tokenType: {
        type: DataTypes.STRING(12),
        field: 'token_type',
        allowNull: false,
        comment: 'access | refresh',
      },

      jti: {
        type: DataTypes.STRING(64),
        allowNull: false,
        comment: 'JWT ID (jti)',
      },

      expiresAt: {
        type: DataTypes.DATE,
        field: 'expires_at',
        allowNull: false,
      },

      revokedAt: {
        type: DataTypes.DATE,
        field: 'revoked_at',
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    getBaseOptions('token_revocations'),
  );

  // Global denylist table; do not apply org scoping.
  model.ignoreOrganizationFilter = true;

  return model;
};

