import { parseQueryParams } from '../../../shared/utils/query-parser.js';
import { formatPaginatedResponse } from '../../../shared/utils/pagination-formatter.js';

export class UserController {
  constructor({ userQueryService, userCommandService }) {
    this.userQueryService = userQueryService;
    this.userCommandService = userCommandService;
  }

  listUsers = async (req, res) => {
    const queryParams = parseQueryParams(req);
    const serviceResponse = await this.userQueryService.listUsers(
      req,
      queryParams,
    );
    const formattedResponse = formatPaginatedResponse(
      serviceResponse,
      queryParams,
    );
    res.json(formattedResponse);
  };

  getUser = async (req, res) => {
    const serviceResponse = await this.userQueryService.getUser(
      req,
      req.params.id,
    );
    res.json(serviceResponse);
  };

  createUser = async (req, res) => {
    const serviceResponse = await this.userCommandService.createUser(
      req,
      req.body,
    );
    res.status(201).json(serviceResponse);
  };

  updateUser = async (req, res) => {
    const serviceResponse = await this.userCommandService.updateUser(
      req,
      req.params.id,
      req.body,
    );
    res.json(serviceResponse);
  };

  deleteUser = async (req, res) => {
    const response = await this.userCommandService.deleteUser(
      req,
      req.params.id,
    );
    res.json(response);
  };

  assignRoles = async (req, res) => {
    const roleIds = req.body.roleIds;
    if (!Array.isArray(roleIds)) {
      return res.status(400).json({
        error: 'roleIds must be an array',
        code: 'VALIDATION_ERROR',
      });
    }
    const response = await this.userCommandService.assignRoles(
      req,
      req.params.id,
      roleIds,
    );
    res.json(response);
  };

  enablePinLogin = async (req, res) => {
    const serviceResponse = await this.userCommandService.enablePinLogin(
      req,
      req.params.id,
    );
    res.json(serviceResponse);
  };

  disablePinLogin = async (req, res) => {
    const serviceResponse = await this.userCommandService.disablePinLogin(
      req,
      req.params.id,
    );
    res.json(serviceResponse);
  };

  getUserByPhone = async (req, res) => {
    const phone = req.params.phone;
    const response = await this.userQueryService.getUserByPhone(req, phone);
    res.json(response);
  };
}
