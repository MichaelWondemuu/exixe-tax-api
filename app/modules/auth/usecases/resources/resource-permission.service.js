import { models } from '../../../../shared/db/data-source.js';
import { HttpError } from '../../../../shared/utils/http-error.js';

export class ResourcePermissionService {
  constructor({ resourcePermissionRepository }) {
    this.resourcePermissionRepository = resourcePermissionRepository;
  }

  listResourcePermissions = async (req, queryParams) => {
    const options = {
      include: [
        { model: models.Resource, as: 'resource' },
        { model: models.Permission, as: 'permission' },
      ],
    };
    const result = await this.resourcePermissionRepository.findAll(
      req,
      options,
      queryParams
    );
    return result;
  };

  getResourcePermission = async (req, id) => {
    const resourcePermission =
      await this.resourcePermissionRepository.findByIdWithDetails(req, id);
    if (!resourcePermission) {
      throw new HttpError(
        404,
        'RESOURCE_PERMISSION_NOT_FOUND',
        'Resource permission not found'
      );
    }
    return { data: resourcePermission };
  };

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
        'Code is required (e.g., "item:list")'
      );
    }

    const resourcePermission = await this.resourcePermissionRepository.create(
      req,
      {
        resourceId: data.resourceId,
        permissionId: data.permissionId,
        code: data.code,
      }
    );

    return {
      message: 'Resource permission created',
      data: resourcePermission,
    };
  };

  updateResourcePermission = async (req, id, data) => {
    const resourcePermission = await this.resourcePermissionRepository.findById(
      req,
      id
    );
    if (!resourcePermission) {
      throw new HttpError(
        404,
        'RESOURCE_PERMISSION_NOT_FOUND',
        'Resource permission not found'
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
      data: updatedResourcePermission,
    };
  };

  deleteResourcePermission = async (req, id) => {
    const resourcePermission = await this.resourcePermissionRepository.findById(
      req,
      id
    );
    if (!resourcePermission) {
      throw new HttpError(
        404,
        'RESOURCE_PERMISSION_NOT_FOUND',
        'Resource permission not found'
      );
    }

    await this.resourcePermissionRepository.delete(req, id);
    return { message: 'Resource permission deleted' };
  };
}
