import { BaseResponse } from '../../../../shared/responses/base.response.js';

export class ResourceResponse {
  static toResponse(resource) {
    if (!resource) return resource;
    const response = {};
    BaseResponse.extendResponse(resource, response);
    response.key = resource.key;
    response.name = resource.name;
    return response;
  }
}
