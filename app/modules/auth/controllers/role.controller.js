import { parseQueryParams } from '../../../shared/utils/query-parser.js';
import { formatPaginatedResponse } from '../../../shared/utils/pagination-formatter.js';

export class RoleController {
  constructor({ roleQueryService, roleCommandService }) {
    this.roleQueryService = roleQueryService;
    this.roleCommandService = roleCommandService;
  }

  listRoles = async (req, res) => {
    const queryParams = parseQueryParams(req);
    const serviceResponse = await this.roleQueryService.listRoles(
      req,
      queryParams,
    );
    const formattedResponse = formatPaginatedResponse(
      serviceResponse,
      queryParams,
    );
    res.json(formattedResponse);
  };

  getRole = async (req, res) => {
    const serviceResponse = await this.roleQueryService.getRole(
      req,
      req.params.id,
    );
    res.json(serviceResponse);
  };

  createRole = async (req, res) => {
    const serviceResponse = await this.roleCommandService.createRole(
      req,
      req.body,
    );
    res.status(201).json(serviceResponse);
  };

  updateRole = async (req, res) => {
    const serviceResponse = await this.roleCommandService.updateRole(
      req,
      req.params.id,
      req.body,
    );
    res.json(serviceResponse);
  };

  deleteRole = async (req, res) => {
    const response = await this.roleCommandService.deleteRole(
      req,
      req.params.id,
    );
    res.json(response);
  };

  assignResourcePermissions = async (req, res) => {
    const resourcePermissionIds = req.body.resourcePermissionIds;
    if (!Array.isArray(resourcePermissionIds)) {
      return res.status(400).json({
        error: 'resourcePermissionIds must be an array',
        code: 'VALIDATION_ERROR',
      });
    }
    const serviceResponse =
      await this.roleCommandService.assignResourcePermissions(
        req,
        req.params.id,
        resourcePermissionIds,
      );
    res.json(serviceResponse);
  };
}
