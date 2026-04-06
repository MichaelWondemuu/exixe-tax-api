/**
 * Query-side facade for user use cases (read-only).
 */
import { DataResponseFormat } from '../../../../shared/utils/response-formatter.js';
import { UserResponse } from './user.response.js';

export class UserQueryService {
  /**
   * @param {{ userService: import('./user.service.js').UserService }} deps
   */
  constructor({ userService }) {
    this.userService = userService;
  }

  listUsers = async (req, queryParams) => {
    const result = await this.userService.listUsers(req, queryParams);
    if (queryParams?.count) {
      return result;
    }
    const rows = result?.data ?? [];
    const mapped = rows.map((item) => UserResponse.toResponse(item));
    return DataResponseFormat.from(mapped, result?.count ?? mapped.length);
  };

  getUser = async (req, id) => {
    const { data } = await this.userService.getUser(req, id);
    return { data: UserResponse.toResponse(data) };
  };

  getUserByPhone = async (req, phone) => {
    const result = await this.userService.getUserByPhone(req, phone);
    if (result?.data == null) {
      return result;
    }
    return { data: UserResponse.toResponse(result.data) };
  };
}
