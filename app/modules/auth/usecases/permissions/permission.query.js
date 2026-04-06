import { HttpError } from '../../../../shared/utils/http-error.js';
import { DataResponseFormat } from '../../../../shared/utils/response-formatter.js';
import { PermissionResponse } from './permission.response.js';

export class PermissionQueryService {
  constructor({ permissionRepository }) {
    this.permissionRepository = permissionRepository;
  }

  listPermissions = async (req, queryParams) => {
    const result = await this.permissionRepository.findAll(req, {}, queryParams);
    if (queryParams?.count) {
      return result;
    }
    const rows = result?.data ?? [];
    const mapped = rows.map((item) => PermissionResponse.toResponse(item));
    return DataResponseFormat.from(mapped, result?.count ?? mapped.length);
  };

  getPermission = async (req, id) => {
    const permission = await this.permissionRepository.findById(req, id);
    if (!permission) {
      throw new HttpError(404, 'PERMISSION_NOT_FOUND', 'Permission not found');
    }
    return { data: PermissionResponse.toResponse(permission) };
  };
}
