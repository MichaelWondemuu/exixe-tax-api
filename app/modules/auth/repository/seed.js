/**
 * Database Seeder
 * Seeds initial data for the authentication system
 * Ensures only one system user exists in the system
 */

import { models, AppDataSource as sequelize } from '../../../shared/db/data-source.js';
import { DataTypes } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../../shared/logger/logger.js';

/**
 * Seed the database with initial data
 * @returns {Promise<void>}
 */
/**
 * Ensure junction tables exist
 * @returns {Promise<void>}
 */
async function ensureJunctionTables() {
  // Ensure UserRole junction table
  try {
    if (models.UserRole) {
      await models.UserRole.sync({ alter: true });
    }
  } catch (syncError) {
    // If sync fails, try to create the table manually
    try {
      await sequelize.getQueryInterface().createTable('user_roles', {
        user_id: {
          type: DataTypes.UUID,
          primaryKey: true,
          allowNull: false,
        },
        role_id: {
          type: DataTypes.UUID,
          primaryKey: true,
          allowNull: false,
        },
      });
    } catch (createError) {
      if (!createError.message.includes('already exists')) {
        logger.warn('Could not create user_roles table:', createError.message);
      }
    }
  }

  // Ensure RoleResourcePermission junction table
  try {
    if (models.RoleResourcePermission) {
      await models.RoleResourcePermission.sync({ alter: true });
    }
  } catch (syncError) {
    // If sync fails, try to create the table manually
    try {
      await sequelize
        .getQueryInterface()
        .createTable('role_resource_permissions', {
          role_id: {
            type: DataTypes.UUID,
            primaryKey: true,
            allowNull: false,
          },
          resource_permission_id: {
            type: DataTypes.UUID,
            primaryKey: true,
            allowNull: false,
          },
        });
    } catch (createError) {
      if (!createError.message.includes('already exists')) {
        logger.warn(
          'Could not create role_resource_permissions table:',
          createError.message
        );
      }
    }
  }

  // Ensure SisterOrganization junction table
  try {
    if (models.SisterOrganization) {
      await models.SisterOrganization.sync({ alter: true });
    }
  } catch (syncError) {
    // If sync fails, try to create the table manually
    try {
      await sequelize.getQueryInterface().createTable('sister_organizations', {
        organization_id: {
          type: DataTypes.UUID,
          primaryKey: true,
          allowNull: false,
        },
        sister_organization_id: {
          type: DataTypes.UUID,
          primaryKey: true,
          allowNull: false,
        },
      });
    } catch (createError) {
      if (!createError.message.includes('already exists')) {
        logger.warn(
          'Could not create sister_organizations table:',
          createError.message
        );
      }
    }
  }
}

export async function seed() {
  try {
    // Ensure critical tables exist before seeding
    // Check if users table exists, if not, sync it
    const [usersTableExists] = await sequelize.query(
      `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users')`
    );

    if (!usersTableExists[0].exists) {
      logger.warn('users table does not exist, attempting to create it...');
      try {
        if (models.User) {
          await models.User.sync();
          logger.info('Successfully created users table');
        } else {
          throw new Error('User model not found');
        }
      } catch (error) {
        logger.error('Failed to create users table:', error.message);
        throw new Error(`Cannot seed database: users table does not exist and could not be created: ${error.message}`);
      }
    }

    // Check if organizations table exists
    const [orgTableExists] = await sequelize.query(
      `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'organizations')`
    );

    if (!orgTableExists[0].exists) {
      logger.warn('organizations table does not exist, attempting to create it...');
      try {
        if (models.Organization) {
          await models.Organization.sync();
          logger.info('Successfully created organizations table');
        }
      } catch (error) {
        logger.error('Failed to create organizations table:', error.message);
        throw new Error(`Cannot seed database: organizations table does not exist and could not be created: ${error.message}`);
      }
    }

    // Ensure junction tables exist before using them
    await ensureJunctionTables();

    // Check or create default "System" organization (singleton)
    // First, ensure no other organizations are marked as system organizations
    if (models.Organization) {
      await models.Organization.update(
        { isSystemOrganization: false },
        { where: { isSystemOrganization: true } },
      );
    }

    let org = await models.Organization.findOne({
      where: { tenantId: 'system-tenant' },
    });
    let orgId;
    if (!org) {
      orgId = uuidv4();
      org = await models.Organization.create({
        id: orgId,
        name: 'System',
        tenantId: 'system-tenant',
        isSystemOrganization: true,
        isActive: true,
      });
    } else {
      // Ensure the existing system tenant is marked as the system organization
      if (!org.isSystemOrganization) {
        await org.update({ isSystemOrganization: true });
      }
      orgId = org.id;
    }

    // Check or create permissions
    const permissions = [
      { code: 'ma', name: 'Manage All', isDefault: true },
      { code: 'ce', name: 'Create', isDefault: true },
      { code: 're', name: 'Read', isDefault: true },
      { code: 'up', name: 'Update', isDefault: true },
      { code: 'de', name: 'Delete', isDefault: true },
      { code: 'li', name: 'List', isDefault: true },
      { code: 'rm', name: 'Remove', isDefault: true },
    ];

    const createdPermissions = {};
    for (const permission of permissions) {
      let perm = await models.Permission.findOne({
        where: { code: permission.code },
      });
      if (!perm) {
        perm = await models.Permission.create({
          id: uuidv4(),
          code: permission.code,
          name: permission.name,
        });
      } else {
      }
      createdPermissions[permission.code] = perm;
    }

    // Check or create resources
    const resources = [
      { key: 'user', name: 'User' },
      { key: 'role', name: 'Role' },
      { key: 'organization', name: 'Organization' },
      { key: 'permission', name: 'Permission' },
      { key: 'resource', name: 'Resource' },
      { key: 'report', name: 'Report' },
      { key: 'product', name: 'Product' },
      { key: 'customer', name: 'Customer' },
      { key: 'order', name: 'Order' },
      { key: 'tax', name: 'Tax' },
      { key: 'uom', name: 'Unit of Measurement' },
    ];

    const createdResources = {};
    for (const resData of resources) {
      let res = await models.Resource.findOne({
        where: { key: resData.key },
      });
      if (!res) {
        res = await models.Resource.create({
          id: uuidv4(),
          key: resData.key,
          name: resData.name,
        });
      }
      createdResources[resData.key] = res;
    }

    // Check or create resource permissions (combinations of resources and permissions)
    const createdResourcePermissions = {};
    for (const res of Object.values(createdResources)) {
      for (const perm of Object.values(createdPermissions)) {
        const code = `${res.key}:${perm.code}`;
        let rp = await models.resourcePermission.findOne({
          where: { code: code },
        });
        if (!rp) {
          rp = await models.resourcePermission.create({
            id: uuidv4(),
            resourceId: res.id,
            permissionId: perm.id,
            code: code,
          });
        }
        createdResourcePermissions[code] = rp;
      }
    }

    // Check or create admin role
    let adminRole = await models.Role.findOne({
      where: { name: 'admin', organizationId: orgId },
    });
    if (!adminRole) {
      adminRole = await models.Role.create({
        id: uuidv4(),
        name: 'admin',
        isSystem: true,
        organizationId: orgId,
      });
    }

    // Check or create system roles (auditor, report) in System organization
    const systemRoleNames = ['auditor', 'report'];
    const systemRolesByName = {};
    for (const roleName of systemRoleNames) {
      let role = await models.Role.findOne({
        where: { name: roleName, organizationId: orgId },
      });
      if (!role) {
        role = await models.Role.create({
          id: uuidv4(),
          name: roleName,
          isSystem: true,
          organizationId: orgId,
        });
      }
      systemRolesByName[roleName] = role;
    }

    // Assign permissions to admin role (check if already assigned)
    const adminPermissions = [
      'user:ma',
      'role:ma',
      'organization:ma',
      'permission:ma',
      'resource:ma',
    ];

    // Add all permissions for full access resources
    const fullAccessResources = ['product', 'customer', 'order', 'tax', 'uom'];
    const permissionTypes = ['ma', 'ce', 're', 'up', 'de', 'li', 'rm'];

    fullAccessResources.forEach(res => {
      permissionTypes.forEach(type => {
        adminPermissions.push(`${res}:${type}`);
      });
    });

    const resourcePermissionsToAdd = [];
    for (const permCode of adminPermissions) {
      if (createdResourcePermissions[permCode]) {
        resourcePermissionsToAdd.push(createdResourcePermissions[permCode]);
      }
    }

    if (resourcePermissionsToAdd.length > 0) {
      // Get current permissions for the role
      const currentPermissions = await adminRole.getResourcePermissions();
      const currentPermissionIds = currentPermissions.map((p) => p.id);
      const permissionsToAdd = resourcePermissionsToAdd.filter(
        (rp) => !currentPermissionIds.includes(rp.id)
      );

      if (permissionsToAdd.length > 0) {
        await adminRole.addResourcePermissions(permissionsToAdd);
      }

      // Assign read/list report permissions to auditor and report roles
      const reportPerms = ['report:re', 'report:li'];
      const reportResourcePermissionsToAdd = reportPerms
        .map((code) => createdResourcePermissions[code])
        .filter(Boolean);

      for (const roleName of systemRoleNames) {
        const role = systemRolesByName[roleName];
        if (!role) continue;
        const current = await role.getResourcePermissions();
        const currentIds = current.map((p) => p.id);
        const toAdd = reportResourcePermissionsToAdd.filter(
          (rp) => !currentIds.includes(rp.id)
        );
        if (toAdd.length > 0) {
          await role.addResourcePermissions(toAdd);
        }
      }

      // Check or create system user
      let adminUser = await models.User.findOne({
        where: { isSystem: true },
      });

      if (!adminUser) {
        adminUser = await models.User.create({
          id: uuidv4(),
          phone: process.env.SYSTEM_USER_PHONE ?? '+251921636677',
          isSystem: true,
          isActive: true,
          organizationId: orgId,
        });
      }

      // Assign admin role to admin user (check if already assigned)
      const userRoles = await adminUser.getRoles();
      const hasAdminRole = userRoles.some((role) => role.id === adminRole.id);

      if (!hasAdminRole) {
        await adminUser.addRole(adminRole);
      }
    }
  } catch (error) {
    logger.error('Error seeding database:', error);
    throw error;
  }
}

/**
 * Check if system user exists
 * @returns {Promise<boolean>}
 */
export async function hasSystemUser() {
  const count = await models.User.count({
    where: { isSystem: true },
  });
  return count > 0;
}

/**
 * Get system user if exists
 * @returns {Promise<Object|null>}
 */
export async function getSystemUser() {
  return models.User.findOne({
    where: { isSystem: true },
    include: [
      {
        model: models.Role,
        as: 'roles',
        required: false,
      },
      {
        model: models.Organization,
        as: 'organization',
        required: false,
      },
    ],
  });
}


