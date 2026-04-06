import { parseQueryParams } from '../../../shared/utils/query-parser.js';
import { formatPaginatedResponse } from '../../../shared/utils/pagination-formatter.js';

export class ResourcePermissionController {
  constructor({
    resourcePermissionQueryService,
    resourcePermissionCommandService,
  }) {
    this.resourcePermissionQueryService = resourcePermissionQueryService;
    this.resourcePermissionCommandService = resourcePermissionCommandService;
  }

  listResourcePermissions = async (req, res) => {
    const queryParams = parseQueryParams(req);
    const serviceResponse =
      await this.resourcePermissionQueryService.listResourcePermissions(
        req,
        queryParams,
      );
    const formattedResponse = formatPaginatedResponse(
      serviceResponse,
      queryParams,
    );
    res.json(formattedResponse);
  };

  getResourcePermission = async (req, res) => {
    const serviceResponse =
      await this.resourcePermissionQueryService.getResourcePermission(
        req,
        req.params.id,
      );
    res.json(serviceResponse);
  };

  createResourcePermission = async (req, res) => {
    const serviceResponse =
      await this.resourcePermissionCommandService.createResourcePermission(
        req,
        req.body,
      );
    res.status(201).json(serviceResponse);
  };

  updateResourcePermission = async (req, res) => {
    const serviceResponse =
      await this.resourcePermissionCommandService.updateResourcePermission(
        req,
        req.params.id,
        req.body,
      );
    res.json(serviceResponse);
  };

  deleteResourcePermission = async (req, res) => {
    const response =
      await this.resourcePermissionCommandService.deleteResourcePermission(
        req,
        req.params.id,
      );
    res.json(response);
  };
}
