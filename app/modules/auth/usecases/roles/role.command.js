import { HttpError } from '../../../../shared/utils/http-error.js';
import { RoleResponse } from './role.response.js';

export class RoleCommandService {
  constructor({ roleRepository, roleQueryService }) {
    this.roleRepository = roleRepository;
    this.roleQueryService = roleQueryService;
  }

  createRole = async (req, data) => {
    if (!data.name) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'Name is required');
    }
    data.isSystem = true;
    if (!req.user.isSystem) {
      data.isSystem = false;
      data.organizationId = req.user.organization.id;
      data.organizationName = req.user.organization.name;
    }
    if (req.user.isSystem) {
      data.organizationId = null;
      data.organizationName = null;
    }
    const existingRole = await this.roleRepository.findByKey(
      req,
      'name',
      data.name,
    );
    if (existingRole) {
      throw new HttpError(400, 'ROLE_ALREADY_EXISTS', 'Role already exists');
    }
    const role = await this.roleRepository.create(req, {
      name: data.name,
      isSystem: data.isSystem || false,
      organizationName: data.organizationName || null,
      organizationId: data.organizationId || null,
    });

    return {
      message: 'Role created',
      data: RoleResponse.toResponse(role),
    };
  };

  updateRole = async (req, id, data) => {
    const role = await this.roleRepository.findById(req, id);
    if (!role) {
      throw new HttpError(404, 'ROLE_NOT_FOUND', 'Role not found');
    }

    const updateData = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.isSystem !== undefined) updateData.isSystem = data.isSystem;
    if (data.roleScope !== undefined) {
      if (!['BRANCH', 'ORGANIZATION'].includes(data.roleScope)) {
        throw new HttpError(
          400,
          'VALIDATION_ERROR',
          'roleScope must be either "BRANCH" or "ORGANIZATION"',
        );
      }
      updateData.roleScope = data.roleScope;
    }
    if (data.organizationName !== undefined)
      updateData.organizationName = data.organizationName;

    const updatedRole = await this.roleRepository.update(req, id, updateData);
    return {
      message: 'Role updated',
      data: RoleResponse.toResponse(updatedRole),
    };
  };

  deleteRole = async (req, id) => {
    const role = await this.roleRepository.findById(req, id);
    if (!role) {
      throw new HttpError(404, 'ROLE_NOT_FOUND', 'Role not found');
    }

    await this.roleRepository.delete(req, id);
    return { message: 'Role deleted' };
  };

  assignResourcePermissions = async (req, roleId, resourcePermissionIds) => {
    const role = await this.roleRepository.findById(req, roleId);
    if (!role) {
      throw new HttpError(404, 'ROLE_NOT_FOUND', 'Role not found');
    }

    await role.setResourcePermissions(resourcePermissionIds);
    const updatedRole = await this.roleQueryService.getRole(req, roleId);
    return {
      message: 'Resource permissions assigned',
      data: updatedRole.data,
    };
  };
}
