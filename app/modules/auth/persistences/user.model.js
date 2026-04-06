import { DataTypes, Op } from 'sequelize';
import { getBaseFields, getBaseOptions } from '../../../shared/db/base.model.js';

export const User = (sequelize) => {
  const model = sequelize.define(
    'User',
    {
      ...getBaseFields(),
      phone: {
        type: DataTypes.STRING(255),
        allowNull: false,
        // Unique constraint is handled by composite index ['phone', 'organization_id'] below
      },
      isSystem: {
        type: DataTypes.BOOLEAN,
        field: 'is_system',
        allowNull: false,
        defaultValue: false,
      },
      scopeLevel: {
        type: DataTypes.STRING(32),
        field: 'scope_level',
        allowNull: false,
        defaultValue: 'ORGANIZATION',
        validate: {
          isIn: [
            ['ORGANIZATION', 'COUNTRY', 'REGION', 'ZONE', 'WOREDA', 'SECTOR'],
          ],
        },
      },
      scopeId: {
        type: DataTypes.STRING(64),
        field: 'scope_id',
        allowNull: true,
        comment:
          'Scope identifier based on scopeLevel: COUNTRY=country code, REGION/ZONE/WOREDA=lookup id (stringified), ORGANIZATION=null',
      },
      scopeSectorIds: {
        type: DataTypes.JSONB,
        field: 'scope_sector_ids',
        allowNull: true,
        defaultValue: null,
        comment:
          'Optional array of sector UUIDs when scopeLevel is SECTOR or to restrict by sectors',
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        field: 'is_active',
        allowNull: false,
        defaultValue: true,
      },
      isDefault: {
        type: DataTypes.BOOLEAN,
        field: 'is_default',
        allowNull: false,
        defaultValue: false,
      },

      accountId: {
        type: DataTypes.UUID,
        field: 'account_id',
        allowNull: true,
      },
      pinHash: {
        type: DataTypes.STRING(255),
        field: 'pin_hash',
        allowNull: true,
        comment: 'Hashed PIN for POS device authentication (4-6 digits)',
      },
      allowPinLogin: {
        type: DataTypes.BOOLEAN,
        field: 'allow_pin_login',
        defaultValue: true,
        comment:
          'Whether PIN login is allowed for this user. If false, no one can use PIN verification with this user account.',
      },
    },
    {
      ...getBaseOptions('users'),
      indexes: [
        {
          unique: true,
          fields: ['phone', 'organization_id'],
          name: 'unique_user_phone_organization',
        },
      ],
      hooks: {
        beforeCreate: async (user) => {
          // organizationId is always required (system users belong to System organization)
          if (!user.organizationId) {
            throw new Error('organizationId is required');
          }

          if (user.isSystem === true) {
            const existingSystemUser = await model.findOne({
              where: { isSystem: true },
            });
            if (existingSystemUser) {
              throw new Error(
                'A system user already exists. Only one system user is allowed in the system.',
              );
            }
          }

          // Enforce phone uniqueness within organization
          const existingUser = await model.findOne({
            where: {
              phone: user.phone,
              organizationId: user.organizationId,
            },
          });
          if (existingUser) {
            throw new Error(
              `User with phone ${user.phone} already exists in this organization.`,
            );
          }
        },
        beforeUpdate: async (user) => {
          // organizationId is always required
          if (!user.organizationId) {
            throw new Error('organizationId is required');
          }

          // Prevent changing a non-system user to system user if one already exists
          if (user.isSystem === true && user.changed('isSystem')) {
            const existingSystemUser = await model.findOne({
              where: {
                isSystem: true,
                id: { [Op.ne]: user.id },
              },
            });
            if (existingSystemUser) {
              throw new Error(
                'A system user already exists. Only one system user is allowed in the system.',
              );
            }
          }

          // Check phone uniqueness when phone, isSystem, or organizationId changes
          if (
            user.changed('phone') ||
            user.changed('isSystem') ||
            user.changed('organizationId')
          ) {
            const existingUser = await model.findOne({
              where: {
                phone: user.phone,
                organizationId: user.organizationId,
                id: { [Op.ne]: user.id },
              },
            });
            if (existingUser) {
              throw new Error(
                `User with phone ${user.phone} already exists in this organization.`,
              );
            }
          }
        },
      },
    },
  );

  model.associate = (models) => {
    // User <-> Role (Many-to-Many)
    // Define UserRole junction table
    const UserRole =
      sequelize.models.UserRole ||
      sequelize.define(
        'UserRole',
        {
          userId: {
            type: DataTypes.UUID,
            primaryKey: true,
            field: 'user_id',
          },
          roleId: {
            type: DataTypes.UUID,
            primaryKey: true,
            field: 'role_id',
          },
        },
        {
          tableName: 'user_roles',
          timestamps: false,
        }
      );
    model.belongsToMany(models.Role, {
      through: UserRole,
      foreignKey: 'userId',
      as: 'roles',
    });

    // User -> Organization (Many-to-One)
    model.belongsTo(models.Organization, {
      foreignKey: 'organizationId',
      as: 'organization',
    });

    // User <-> Warehouse (Many-to-Many)
    // Use UserWarehouse junction table
    const UserWarehouse = sequelize.models.UserWarehouse;
    if (UserWarehouse) {
      model.belongsToMany(models.Warehouse, {
        through: UserWarehouse,
        foreignKey: 'userId',
        as: 'warehouses',
      });
    }
  };

  return model;
};

