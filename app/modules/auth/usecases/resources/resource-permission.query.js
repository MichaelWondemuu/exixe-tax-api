import { models } from '../../../../shared/db/data-source.js';
import { HttpError } from '../../../../shared/utils/http-error.js';
import { DataResponseFormat } from '../../../../shared/utils/response-formatter.js';
import { ResourcePermissionResponse } from './resource-permission.response.js';

export class ResourcePermissionQueryService {
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
      queryParams,
    );
    if (queryParams?.count) {
      return result;
    }
    const rows = result?.data ?? [];
    const mapped = rows.map((item) =>
      ResourcePermissionResponse.toResponse(item),
    );
    return DataResponseFormat.from(mapped, result?.count ?? mapped.length);
  };

  getResourcePermission = async (req, id) => {
    const resourcePermission =
      await this.resourcePermissionRepository.findByIdWithDetails(req, id);
    if (!resourcePermission) {
      throw new HttpError(
        404,
        'RESOURCE_PERMISSION_NOT_FOUND',
        'Resource permission not found',
      );
    }
    return { data: ResourcePermissionResponse.toResponse(resourcePermission) };
  };
}
