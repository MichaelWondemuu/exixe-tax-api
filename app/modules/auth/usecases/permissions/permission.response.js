import { BaseResponse } from '../../../../shared/responses/base.response.js';

export class PermissionResponse {
  static toResponse(permission) {
    if (!permission) return permission;
    const response = {};
    BaseResponse.extendResponse(permission, response);
    response.code = permission.code;
    response.name = permission.name;
    response.isDefault = permission.isDefault;
    return response;
  }
}
