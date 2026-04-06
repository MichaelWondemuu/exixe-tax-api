import { BaseResponse } from '../../../../shared/responses/base.response.js';
import { PermissionResponse } from '../permissions/permission.response.js';
import { ResourceResponse } from './resource.response.js';

export class ResourcePermissionResponse {
  static toResponse(rp) {
    if (!rp) return rp;
    const response = {};
    BaseResponse.extendResponse(rp, response);
    response.resourceId = rp.resourceId;
    response.permissionId = rp.permissionId;
    response.code = rp.code;
    if (rp.resource) {
      response.resource = ResourceResponse.toResponse(rp.resource);
    }
    if (rp.permission) {
      response.permission = PermissionResponse.toResponse(rp.permission);
    }
    return response;
  }
}
