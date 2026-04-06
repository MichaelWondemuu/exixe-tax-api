import { HttpError } from '../../../../shared/utils/http-error.js';
import { PermissionResponse } from './permission.response.js';

export class PermissionCommandService {
  constructor({ permissionRepository }) {
    this.permissionRepository = permissionRepository;
  }

  createPermission = async (req, data) => {
    if (!data.code) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'Code is required');
    }

    const permission = await this.permissionRepository.create(req, {
      code: data.code,
      name: data.name || null,
    });

    return {
      message: 'Permission created',
      data: PermissionResponse.toResponse(permission),
    };
  };

  updatePermission = async (req, id, data) => {
    const permission = await this.permissionRepository.findById(req, id);
    if (!permission) {
      throw new HttpError(404, 'PERMISSION_NOT_FOUND', 'Permission not found');
    }

    const updateData = {};
    if (data.code !== undefined) updateData.code = data.code;
    if (data.name !== undefined) updateData.name = data.name;

    const updatedPermission = await this.permissionRepository.update(
      req,
      id,
      updateData,
    );
    return {
      message: 'Permission updated',
      data: PermissionResponse.toResponse(updatedPermission),
    };
  };

  deletePermission = async (req, id) => {
    const permission = await this.permissionRepository.findById(req, id);
    if (!permission) {
      throw new HttpError(404, 'PERMISSION_NOT_FOUND', 'Permission not found');
    }

    await this.permissionRepository.delete(req, id);
    return { message: 'Permission deleted' };
  };
}
