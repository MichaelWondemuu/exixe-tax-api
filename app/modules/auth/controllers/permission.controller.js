import { parseQueryParams } from '../../../shared/utils/query-parser.js';
import { formatPaginatedResponse } from '../../../shared/utils/pagination-formatter.js';

export class PermissionController {
  constructor({ permissionQueryService, permissionCommandService }) {
    this.permissionQueryService = permissionQueryService;
    this.permissionCommandService = permissionCommandService;
  }

  listPermissions = async (req, res) => {
    const queryParams = parseQueryParams(req);
    const serviceResponse = await this.permissionQueryService.listPermissions(
      req,
      queryParams,
    );
    const formattedResponse = formatPaginatedResponse(
      serviceResponse,
      queryParams,
    );
    res.json(formattedResponse);
  };

  getPermission = async (req, res) => {
    const serviceResponse = await this.permissionQueryService.getPermission(
      req,
      req.params.id,
    );
    res.json(serviceResponse);
  };

  createPermission = async (req, res) => {
    const serviceResponse =
      await this.permissionCommandService.createPermission(req, req.body);
    res.status(201).json(serviceResponse);
  };

  updatePermission = async (req, res) => {
    const serviceResponse =
      await this.permissionCommandService.updatePermission(
        req,
        req.params.id,
        req.body,
      );
    res.json(serviceResponse);
  };

  deletePermission = async (req, res) => {
    const response = await this.permissionCommandService.deletePermission(
      req,
      req.params.id,
    );
    res.json(response);
  };
}
