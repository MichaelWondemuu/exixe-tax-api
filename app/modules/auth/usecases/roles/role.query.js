import { HttpError } from '../../../../shared/utils/http-error.js';
import { DataResponseFormat } from '../../../../shared/utils/response-formatter.js';
import { Op } from 'sequelize';
import { RoleResponse } from './role.response.js';

export class RoleQueryService {
  constructor({ roleRepository }) {
    this.roleRepository = roleRepository;
  }

  async loadUserRolesWithPermissions(userId) {
    return this.roleRepository.loadUserRolesWithPermissions(userId);
  }

  listRoles = async (req, queryParams) => {
    const options = {};
    const baseOrConditions = [];

    if (!req.user.isSystem) {
      baseOrConditions.push({ organizationId: req?.user?.organization?.id });
    }
    baseOrConditions.push({ isSystem: true });

    options.where = {};
    const allOrConditions = [...baseOrConditions];
    if (
      queryParams &&
      queryParams.whereOr &&
      Array.isArray(queryParams.whereOr)
    ) {
      allOrConditions.push(...queryParams.whereOr);
    }

    if (allOrConditions.length > 0) {
      if (allOrConditions.length === 1) {
        Object.assign(options.where, allOrConditions[0]);
      } else {
        options.where[Op.or] = allOrConditions;
      }
    }

    if (queryParams && queryParams.where) {
      Object.assign(options.where, queryParams.where);
    }

    if (queryParams && queryParams.whereAnd) {
      if (Array.isArray(queryParams.whereAnd)) {
        if (options.where[Op.and]) {
          options.where[Op.and] = [
            ...options.where[Op.and],
            ...queryParams.whereAnd,
          ];
        } else {
          options.where[Op.and] = [...queryParams.whereAnd];
        }
      } else if (typeof queryParams.whereAnd === 'object') {
        Object.assign(options.where, queryParams.whereAnd);
      }
    }

    const result = await this.roleRepository.findAll(req, options, queryParams);
    if (queryParams?.count) {
      return result;
    }
    const rows = result?.data ?? [];
    const mapped = rows.map((item) => RoleResponse.toResponse(item));
    return DataResponseFormat.from(mapped, result?.count ?? mapped.length);
  };

  getRole = async (req, id) => {
    const { models } = await import('../../../../shared/db/data-source.js');
    const role = await this.roleRepository.findById(req, id, {
      include: [
        {
          model: models.resourcePermission,
          as: 'resourcePermissions',
          required: false,
          include: [
            {
              model: models.Resource,
              as: 'resource',
              required: false,
            },
            {
              model: models.Permission,
              as: 'permission',
              required: false,
            },
          ],
        },
      ],
    });
    if (!role) {
      throw new HttpError(404, 'ROLE_NOT_FOUND', 'Role not found');
    }
    return { data: RoleResponse.toResponse(role) };
  };
}
