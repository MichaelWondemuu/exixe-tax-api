// import { HttpError } from '../../../../shared/utils/http-error.js';
// import { Op } from 'sequelize';

// export class RoleService {
//   constructor({ roleRepository }) {
//     this.roleRepository = roleRepository;
//   }

//   /**
//    * Load user roles with resource permissions
//    * This is used by scope-aware permission middleware
//    */
//   async loadUserRolesWithPermissions(userId) {
//     return this.roleRepository.loadUserRolesWithPermissions(userId);
//   }

//   /**
//    * List roles with support for OR/AND filtering
//    *
//    * For non-system users, shows:
//    * - System roles (isSystem: true) OR
//    * - Roles belonging to their organization
//    *
//    * Supports complex filtering via queryParams:
//    * - queryParams.where: AND conditions (merged with base filters)
//    * - queryParams.whereOr: OR conditions (combined with base OR)
//    * - queryParams.whereAnd: Additional AND conditions
//    *
//    * Example queryParams:
//    * {
//    *   where: { name: 'Admin' },  // AND condition
//    *   whereOr: [{ isActive: true }, { isActive: false }],  // OR conditions
//    *   whereAnd: { organizationId: 'xxx' }  // Additional AND condition
//    * }
//    */
//   listRoles = async (req, queryParams) => {
//     const options = {};

//     // Base OR conditions for non-system users
//     const baseOrConditions = [];

//     if (!req.user.isSystem) {
//       baseOrConditions.push({ organizationId: req?.user?.organization?.id });
//     }
//     baseOrConditions.push({ isSystem: true });

//     // Build where clause
//     options.where = {};

//     // Combine base OR conditions with queryParams.whereOr
//     const allOrConditions = [...baseOrConditions];
//     if (
//       queryParams &&
//       queryParams.whereOr &&
//       Array.isArray(queryParams.whereOr)
//     ) {
//       allOrConditions.push(...queryParams.whereOr);
//     }

//     // Add OR conditions if we have any
//     if (allOrConditions.length > 0) {
//       if (allOrConditions.length === 1) {
//         // Single condition, no need for Op.or wrapper
//         Object.assign(options.where, allOrConditions[0]);
//       } else {
//         // Multiple OR conditions
//         options.where[Op.or] = allOrConditions;
//       }
//     }

//     if (queryParams && queryParams.where) {
//       Object.assign(options.where, queryParams.where);
//     }

//     if (queryParams && queryParams.whereAnd) {
//       if (Array.isArray(queryParams.whereAnd)) {
//         if (options.where[Op.and]) {
//           options.where[Op.and] = [
//             ...options.where[Op.and],
//             ...queryParams.whereAnd,
//           ];
//         } else {
//           options.where[Op.and] = [...queryParams.whereAnd];
//         }
//       } else if (typeof queryParams.whereAnd === 'object') {
//         Object.assign(options.where, queryParams.whereAnd);
//       }
//     }

//     return await this.roleRepository.findAll(req, options, queryParams);
//   };

//   getRole = async (req, id) => {
//     const { models } = await import('../../../../shared/db/data-source.js');
//     const role = await this.roleRepository.findById(req, id, {
//       include: [
//         {
//           model: models.resourcePermission,
//           as: 'resourcePermissions',
//           required: false,
//           include: [
//             {
//               model: models.Resource,
//               as: 'resource',
//               required: false,
//             },
//             {
//               model: models.Permission,
//               as: 'permission',
//               required: false,
//             },
//           ],
//         },
//       ],
//     });
//     if (!role) {
//       throw new HttpError(404, 'ROLE_NOT_FOUND', 'Role not found');
//     }
//     return { data: role };
//   };

//   createRole = async (req, data) => {
//     if (!data.name) {
//       throw new HttpError(400, 'VALIDATION_ERROR', 'Name is required');
//     }
//     data.isSystem = true;
//     if (!req.user.isSystem) {
//       data.isSystem = false;
//       data.organizationId = req.user.organization.id;
//       data.organizationName = req.user.organization.name;
//     }
//     if (req.user.isSystem) {
//       data.organizationId = null;
//       data.organizationName = null;
//     }
//     // find if role already exists
//     const existingRole = await this.roleRepository.findByKey(
//       req,
//       'name',
//       data.name
//     );
//     if (existingRole) {
//       throw new HttpError(400, 'ROLE_ALREADY_EXISTS', 'Role already exists');
//     }
//     const role = await this.roleRepository.create(req, {
//       name: data.name,
//       isSystem: data.isSystem || false,
//       organizationName: data.organizationName || null,
//       organizationId: data.organizationId || null,
//     });

//     return {
//       message: 'Role created',
//       data: role,
//     };
//   };

//   updateRole = async (req, id, data) => {
//     const role = await this.roleRepository.findById(req, id);
//     if (!role) {
//       throw new HttpError(404, 'ROLE_NOT_FOUND', 'Role not found');
//     }

//     const updateData = {};
//     if (data.name !== undefined) updateData.name = data.name;
//     if (data.isSystem !== undefined) updateData.isSystem = data.isSystem;
//     if (data.roleScope !== undefined) {
//       if (!['BRANCH', 'ORGANIZATION'].includes(data.roleScope)) {
//         throw new HttpError(
//           400,
//           'VALIDATION_ERROR',
//           'roleScope must be either "BRANCH" or "ORGANIZATION"'
//         );
//       }
//       updateData.roleScope = data.roleScope;
//     }
//     if (data.organizationName !== undefined)
//       updateData.organizationName = data.organizationName;

//     const updatedRole = await this.roleRepository.update(req, id, updateData);
//     return {
//       message: 'Role updated',
//       data: updatedRole,
//     };
//   };

//   deleteRole = async (req, id) => {
//     const role = await this.roleRepository.findById(req, id);
//     if (!role) {
//       throw new HttpError(404, 'ROLE_NOT_FOUND', 'Role not found');
//     }

//     await this.roleRepository.delete(req, id);
//     return { message: 'Role deleted' };
//   };

//   assignResourcePermissions = async (req, roleId, resourcePermissionIds) => {
//     const { models } = await import('../../../../shared/db/data-source.js');
//     const role = await this.roleRepository.findById(req, roleId);
//     if (!role) {
//       throw new HttpError(404, 'ROLE_NOT_FOUND', 'Role not found');
//     }

//     await role.setResourcePermissions(resourcePermissionIds);
//     const updatedRole = await this.getRole(req, roleId);
//     return {
//       message: 'Resource permissions assigned',
//       data: updatedRole.data,
//     };
//   };
// }
