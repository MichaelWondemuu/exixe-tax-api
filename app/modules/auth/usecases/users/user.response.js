import { BaseResponse } from '../../../../shared/responses/base.response.js';
import { OrganizationResponse } from '../organizations/organization.response.js';
import { RoleResponse } from '../roles/role.response.js';

export class UserResponse {
  static toResponse(user) {
    if (!user) return user;
    const response = {};
    BaseResponse.extendResponse(user, response);
    response.phone = user.phone;
    response.isSystem = user.isSystem;
    response.scopeLevel = user.scopeLevel;
    response.scopeId = user.scopeId;
    response.scopeSectorIds = user.scopeSectorIds;
    response.isActive = user.isActive;
    response.isDefault = user.isDefault;
    response.accountId = user.accountId;
    response.allowPinLogin = user.allowPinLogin;
    response.email = user.email;
    response.firstname = user.firstname;
    response.lastname = user.lastname;
    response.middlename = user.middlename;
    response.avatarUrl = user.avatarUrl;

    if (user.organization) {
      response.organization = OrganizationResponse.toResponse(user.organization);
    }
    if (Array.isArray(user.roles)) {
      response.roles = user.roles.map((role) => RoleResponse.toResponse(role));
    }

    return response;
  }
}
