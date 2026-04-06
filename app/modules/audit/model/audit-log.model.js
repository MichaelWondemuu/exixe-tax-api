import { DataTypes } from 'sequelize';

/**
 * AuditLog model - stores every API request/response for audit trail.
 * No paranoid/soft delete; logs are immutable.
 */
export const AuditLog = (sequelize) => {
  const model = sequelize.define(
    'AuditLog',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      // Request
      method: {
        type: DataTypes.STRING(10),
        allowNull: false,
        field: 'method',
      },
      path: {
        type: DataTypes.STRING(2048),
        allowNull: false,
        field: 'path',
      },
      module: {
        type: DataTypes.STRING(64),
        allowNull: true,
        field: 'module',
        comment: 'Derived from path, e.g. sales, auth, inventory',
      },
      query: {
        type: DataTypes.JSONB,
        allowNull: true,
        field: 'query',
      },
      requestBody: {
        type: DataTypes.JSONB,
        allowNull: true,
        field: 'request_body',
      },
      // Response
      responseStatus: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'response_status',
      },
      responseBody: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'response_body',
        comment: 'Truncated response body for storage',
      },
      // Actor (nullable for public/unauthenticated requests)
      userId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'user_id',
      },
      username: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'username',
      },
      organizationId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'organization_id',
      },
      // Request metadata
      ipAddress: {
        type: DataTypes.STRING(45),
        allowNull: true,
        field: 'ip_address',
      },
      userAgent: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'user_agent',
      },
      durationMs: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'duration_ms',
      },
      // Timestamp
      createdAt: {
        type: DataTypes.DATE,
        field: 'created_at',
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      tableName: 'audit_logs',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: false,
      paranoid: false,
      underscored: true,
    }
  );
  return model;
};
