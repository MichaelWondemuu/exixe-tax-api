import { HttpError } from '../../../../shared/utils/http-error.js';
import { DataResponseFormat } from '../../../../shared/utils/response-formatter.js';
import { ResourceResponse } from './resource.response.js';

export class ResourceQueryService {
  constructor({ resourceRepository }) {
    this.resourceRepository = resourceRepository;
  }

  listResources = async (req, queryParams) => {
    const result = await this.resourceRepository.findAll(req, {}, queryParams);
    if (queryParams?.count) {
      return result;
    }
    const rows = result?.data ?? [];
    const mapped = rows.map((item) => ResourceResponse.toResponse(item));
    return DataResponseFormat.from(mapped, result?.count ?? mapped.length);
  };

  getResource = async (req, id) => {
    const resource = await this.resourceRepository.findById(req, id);
    if (!resource) {
      throw new HttpError(404, 'RESOURCE_NOT_FOUND', 'Resource not found');
    }
    return { data: ResourceResponse.toResponse(resource) };
  };
}
