/**
 * Command-side facade for user use cases (mutations).
 */
import { UserResponse } from './user.response.js';

function mapUserCommandPayload(result) {
  if (!result || typeof result !== 'object') return result;
  if (
    !Object.prototype.hasOwnProperty.call(result, 'data') ||
    result.data == null
  ) {
    return result;
  }
  return {
    ...result,
    data: UserResponse.toResponse(result.data),
  };
}

export class UserCommandService {
  constructor({ userService }) {
    this.userService = userService;
  }

  createUser = async (req, data) => {
    const result = await this.userService.createUser(req, data);
    return mapUserCommandPayload(result);
  };

  updateUser = async (req, id, data) => {
    const result = await this.userService.updateUser(req, id, data);
    return mapUserCommandPayload(result);
  };

  deleteUser = (req, id) => this.userService.deleteUser(req, id);

  assignRoles = async (req, userId, roleIds) => {
    const result = await this.userService.assignRoles(req, userId, roleIds);
    return mapUserCommandPayload(result);
  };

  enablePinLogin = async (req, userId) => {
    const result = await this.userService.enablePinLogin(req, userId);
    return mapUserCommandPayload(result);
  };

  disablePinLogin = async (req, userId) => {
    const result = await this.userService.disablePinLogin(req, userId);
    return mapUserCommandPayload(result);
  };
}
