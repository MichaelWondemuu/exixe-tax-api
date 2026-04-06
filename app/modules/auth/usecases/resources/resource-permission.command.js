import { HttpError } from '../../../../shared/utils/http-error.js';
import { ResourcePermissionResponse } from './resource-permission.response.js';

export class ResourcePermissionCommandService {
  constructor({ resourcePermissionRepository }) {
    this.resourcePermissionRepository = resourcePermissionRepository;
  }

  createResourcePermission = async (req, data) => {
    if (!data.resourceId) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'Resource ID is required');
    }
    if (!data.permissionId) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'Permission ID is required');
    }
    if (!data.code) {
      throw new HttpError(
        400,
        'VALIDATION_ERROR',
        'Code is required (e.g., "item:list")',
      );
    }

    const resourcePermission = await this.resourcePermissionRepository.create(
      req,
      {
        resourceId: data.resourceId,
        permissionId: data.permissionId,
        code: data.code,
      },
    );

    return {
      message: 'Resource permission created',
      data: ResourcePermissionResponse.toResponse(resourcePermission),
    };
  };

  updateResourcePermission = async (req, id, data) => {
    const resourcePermission =
      await this.resourcePermissionRepository.findById(req, id);
    if (!resourcePermission) {
      throw new HttpError(
        404,
        'RESOURCE_PERMISSION_NOT_FOUND',
        'Resource permission not found',
      );
    }

    const updateData = {};
    if (data.resourceId !== undefined) updateData.resourceId = data.resourceId;
    if (data.permissionId !== undefined)
      updateData.permissionId = data.permissionId;
    if (data.code !== undefined) updateData.code = data.code;

    const updatedResourcePermission =
      await this.resourcePermissionRepository.update(req, id, updateData);
    return {
      message: 'Resource permission updated',
      data: ResourcePermissionResponse.toResponse(updatedResourcePermission),
    };
  };

  deleteResourcePermission = async (req, id) => {
    const resourcePermission =
      await this.resourcePermissionRepository.findById(req, id);
    if (!resourcePermission) {
      throw new HttpError(
        404,
        'RESOURCE_PERMISSION_NOT_FOUND',
        'Resource permission not found',
      );
    }

    await this.resourcePermissionRepository.delete(req, id);
    return { message: 'Resource permission deleted' };
  };
}
