import { BaseResponse } from '../../../../shared/responses/base.response.js';
import { ResourcePermissionResponse } from '../resources/resource-permission.response.js';

export class RoleResponse {
  static toResponse(role) {
    if (!role) return role;
    const response = {};
    BaseResponse.extendResponse(role, response);
    response.name = role.name;
    response.isSystem = role.isSystem;
    response.organizationName = role.organizationName;

    if (Array.isArray(role.resourcePermissions)) {
      response.resourcePermissions = role.resourcePermissions.map((rp) =>
        ResourcePermissionResponse.toResponse(rp),
      );
    }

    return response;
  }
}
