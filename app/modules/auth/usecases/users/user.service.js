import { models } from '../../../../shared/db/data-source.js';
import { HttpError } from '../../../../shared/utils/http-error.js';
import { createCentralAuthService } from '../auths/central-auth.service.js';
import { PhoneUtil } from '../../../../shared/utils/phone.util.js';
import { validateNewScopeNotBroaderThanAdmin } from '../../utils/scope-helper.js';
import { validatePasswordStrength, generateStrongPassword } from '../../../../shared/utils/password-validator.js';
import { Op } from 'sequelize';

export class UserService {
  constructor({ userRepository }) {
    this.userRepository = userRepository;
    this.centralAuth = createCentralAuthService();
  }
  /** Default password for new users when none is provided. They can change it via PUT /auth/password/update/:id after first login. */
  generateRandomPassword = () => {
    // Generate a strong password that satisfies the system password policy (Security Audit #9)
    return generateStrongPassword(16);
  };
  listUsers = async (req, queryParams) => {
    // include organization
    const options = {
      include: [
        {
          model: models.Organization,
          as: 'organization',
          required: false,
        },
        {
          model: models.Role,
          as: 'roles',
          required: false,
        },
      ],
    };
    // if user is system, filter anly admin role have users
    if (req.user.isSystem) {
      options.include.push({
        model: models.Role,
        as: 'roles',
        required: true,
        where: { name: 'admin' },
      });
    }
    const result = await this.userRepository.findAll(req, options, queryParams);

    return result;
  };

  getUser = async (req, id) => {
    const user = await this.userRepository.findByIdWithRoles(req, id);
    if (
      !user ||
      (req.user.isSystem && !user.roles?.some((role) => role.name === 'admin'))
    ) {
      throw new HttpError(404, 'USER_NOT_FOUND', 'User not found');
    }
    // Build plain object so we can add central-auth-only fields (email, names, avatar)
    const data = user.get
      ? user.get({ plain: true })
      : user.toJSON
        ? user.toJSON()
        : { ...user };

    // Enrich with user info from central auth when available
    if (this.centralAuth && user.phone) {
      try {
        const centralAuthUser = await this.centralAuth.getUserByMobile(
          user.phone,
        );
        if (centralAuthUser) {
          data.email = centralAuthUser.email ?? data.email ?? null;
          data.firstname = centralAuthUser.firstname ?? data.firstname ?? null;
          data.lastname = centralAuthUser.lastname ?? data.lastname ?? '';
          data.middlename =
            centralAuthUser.middlename ?? data.middlename ?? null;
          data.avatarUrl = centralAuthUser.avatarUrl ?? data.avatarUrl ?? null;
        }
      } catch {
        // Return user without central auth fields if service is unavailable
      }
    }

    return { data };
  };

  /**
   * Get user by phone from central auth.
   * GET /get-user-by-phone?phone=...
   */
  getUserByPhone = async (req, phone) => {
    if (!phone) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'phone query is required');
    }
    let formattedPhone;
    try {
      formattedPhone = PhoneUtil.checkValidPhone(phone, 'ET');
    } catch (error) {
      throw new HttpError(
        400,
        'VALIDATION_ERROR',
        error.message || 'Invalid phone number format',
      );
    }
    try {
      const isSystem = req.user?.isSystem === true;
      if (!isSystem) {
        const currentOrgId = req.user?.organization?.id;

        const getAllDescendantOrgIds = async (startOrgIds) => {
          const allowed = new Set(startOrgIds);
          const queue = [...startOrgIds];

          while (queue.length > 0) {
            const parentId = queue.shift();
            const children = await models.Organization.findAll({
              where: { parentId },
              attributes: ['id'],
              raw: true,
            });

            for (const child of children) {
              if (!allowed.has(child.id)) {
                allowed.add(child.id);
                queue.push(child.id);
              }
            }
          }

          return allowed;
        };

        const allowedOrgIds = new Set();

        // 1) current org + descendants
        allowedOrgIds.add(currentOrgId);
        const descendantIds = await getAllDescendantOrgIds([currentOrgId]);
        for (const id of descendantIds) allowedOrgIds.add(id);

        // 2) sister orgs + their descendants
        let sisterIds = [];
        try {
          const currentOrg = await models.Organization.findByPk(currentOrgId, {
            include: [
              {
                model: models.Organization,
                as: 'sisterOrganizations',
                required: false,
              },
            ],
          });

          sisterIds = currentOrg?.sisterOrganizations?.map((o) => o.id) || [];
        } catch {
          // If sister_organizations table/association isn't ready yet, ignore sisters.
          sisterIds = [];
        }

        if (sisterIds.length > 0) {
          const sisterDescendants = await getAllDescendantOrgIds(sisterIds);
          for (const id of sisterDescendants) allowedOrgIds.add(id);
        }

        const localUser = await models.User.findOne({
          where: {
            phone: formattedPhone,
            isSystem: false,
            organizationId: { [Op.in]: Array.from(allowedOrgIds) },
          },
          attributes: ['id', 'organizationId'],
        });

        if (!localUser) {
          return { data: null };
        }
      }

      const centralUser =
        await this.centralAuth.getUserByMobile(formattedPhone);
      return { data: centralUser };
    } catch (err) {
      const isNotFound =
        err.message?.includes('User not found') ||
        err.message?.includes('not found');
      if (isNotFound) {
        throw new HttpError(
          404,
          'USER_NOT_FOUND',
          err.message || 'User not found',
        );
      }
      throw new HttpError(
        502,
        'CENTRAL_AUTH_ERROR',
        err.message || 'Failed to get user from central auth',
      );
    }
  };

  /**
   * Create a user. New users are created with a default password when none is provided;
   * they can change it using the reset password flow (PUT /auth/password/update/:id) after first login.
   */
  createUser = async (req, data) => {
    if (!data.phone) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'Phone is required');
    }
    // check if the phone is already in use
    const existingUser = await this.userRepository.findByAccountIdOrPhone(
      req,
      null,
      data.phone,
    );
    if (existingUser.length > 0) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'User is already exists');
    }

    if (req.user?.isSystem && data.organizationId) {
      const existingAdmin = await models.User.findOne({
        where: { organizationId: data.organizationId },
        include: [
          {
            model: models.Role,
            as: 'roles',
            where: { name: 'admin' },
            required: true,
          },
        ],
      });
      if (existingAdmin) {
        throw new HttpError(
          403,
          'ORGANIZATION_HAS_ADMIN',
          'Cannot create user: organization already has a user with admin role',
        );
      }
    }

    let formattedPhone;
    try {
      formattedPhone = PhoneUtil.checkValidPhone(data.phone, 'ET');
    } catch (error) {
      throw new HttpError(
        400,
        'VALIDATION_ERROR',
        error.message || 'Invalid phone number format',
      );
    }

    const firstname = data.firstname ?? '';
    const lastname = data.lastname ?? '';
    const middlename = data.middlename ?? null;
    const defaultPasswordUsed = !data.password;
    const password = this.generateRandomPassword();
    data.organizationId = req.user.organization.id;

    let accountId = data.accountId || null;
    let centralUser = null;
    // Check user by mobile first; if not found, sign up with password (default or provided)
    try {
      centralUser = await this.centralAuth.getUserByMobile(formattedPhone);
      if (centralUser?.id) {
        accountId = centralUser.id;
      } else {
        if (!firstname || !lastname) {
          throw new HttpError(
            400,
            'VALIDATION_ERROR',
            'firstname and lastname are required for new users',
          );
        }
        if (!password || typeof password !== 'string') {
          throw new HttpError(
            400,
            'VALIDATION_ERROR',
            'password is required for new users',
          );
        }
        await validatePasswordStrength(password);

        await this.centralAuth.signupWithPassword({
          firstname,
          lastname,
          middlename,
          mobile: formattedPhone,
          password,
        });
      }
    } catch (err) {
      const isNotFound =
        err.response?.status === 404 ||
        (err.message && err.message.includes('User not found'));
      if (isNotFound) {
        if (!firstname || !lastname) {
          throw new HttpError(
            400,
            'VALIDATION_ERROR',
            'firstname and lastname are required for new users',
          );
        }
        if (!password || typeof password !== 'string') {
          throw new HttpError(
            400,
            'VALIDATION_ERROR',
            'password is required for new users',
          );
        }
        await validatePasswordStrength(password);

        await this.centralAuth.signupWithPassword({
          firstname,
          lastname,
          middlename,
          mobile: formattedPhone,
          password,
        });
      } else {
        throw new HttpError(
          502,
          'CENTRAL_AUTH_ERROR',
          err.message || 'Failed to check or create central auth user',
        );
      }
    }

    const user = await this.userRepository.create(req, {
      phone: formattedPhone,
      isSystem: false,
      isActive: centralUser ? true : false,
      accountId,
    });

    return {
      message: defaultPasswordUsed
        ? 'User created with default password; they can change it after first login via PUT /auth/password/update/:id'
        : 'User created',
      data: user,
      defaultPasswordUsed: defaultPasswordUsed || undefined,
    };
  };

  updateUser = async (req, id, data) => {
    const user = await this.userRepository.findById(req, id, {
      include: [
        {
          model: models.Organization,
          as: 'organization',
          required: false,
          attributes: ['id', 'tenantId', 'isSystemOrganization'],
        },
      ],
    });
    if (!user) {
      throw new HttpError(404, 'USER_NOT_FOUND', 'User not found');
    }

    const updateData = {};
    if (data.phone !== undefined) updateData.phone = data.phone;
    delete data.isSystem;
    delete data.isActive;
    delete data.isDefault;
    delete data.accountId;
    delete data.scopeLevel;
    delete data.scopeId;
    delete data.scopeSectorIds;
    delete data.sectorIds;
    if (data.accountId !== undefined) updateData.accountId = data.accountId;

    const targetIsSystemOrg = user.organization.isSystemOrganization;
    if (
      targetIsSystemOrg &&
      (data.scopeLevel !== undefined ||
        data.scopeId !== undefined ||
        data.scopeSectorIds !== undefined ||
        data.sectorIds !== undefined)
    ) {
      const newScopeLevel =
        data.scopeLevel !== undefined ? data.scopeLevel : user.scopeLevel;
      const newScopeId =
        data.scopeId !== undefined
          ? data.scopeId != null && data.scopeId !== ''
            ? String(data.scopeId)
            : null
          : user.scopeId;
      let newScopeSectorIds = data.scopeSectorIds;
      if (Array.isArray(data.sectorIds) && data.sectorIds.length > 0) {
        newScopeSectorIds = data.sectorIds.filter(
          (sid) => sid != null && String(sid).trim() !== '',
        );
      }
      if (newScopeSectorIds === undefined)
        newScopeSectorIds = user.scopeSectorIds;

      const creatorUser = await models.User.findByPk(req.user?.userId, {
        attributes: [
          'id',
          'organizationId',
          'scopeLevel',
          'scopeId',
          'scopeSectorIds',
        ],
        include: [
          {
            model: models.Organization,
            as: 'organization',
            required: false,
            attributes: ['id', 'tenantId'],
          },
          {
            model: models.Role,
            as: 'roles',
            required: false,
            attributes: ['name'],
          },
        ],
      });
      if (creatorUser && creatorUser.organization.isSystemOrganization) {
        const isAdmin = (creatorUser.roles || []).some(
          (r) => r.name === 'admin',
        );
        if (isAdmin) {
          const validation = await validateNewScopeNotBroaderThanAdmin(
            models,
            creatorUser,
            newScopeLevel,
            newScopeId,
            newScopeSectorIds,
          );
          if (!validation.allowed) {
            throw new HttpError(403, 'SCOPE_NOT_ALLOWED', validation.message);
          }
        }
      }
    }

    if (data.scopeLevel !== undefined) updateData.scopeLevel = data.scopeLevel;
    if (data.scopeId !== undefined) updateData.scopeId = data.scopeId;
    if (data.scopeSectorIds !== undefined)
      updateData.scopeSectorIds = data.scopeSectorIds;
    if (targetIsSystemOrg && Array.isArray(data.sectorIds)) {
      updateData.scopeSectorIds = data.sectorIds.filter(
        (sid) => sid != null && String(sid).trim() !== '',
      );
    }

    const updatedUser = await this.userRepository.update(req, id, updateData);
    return {
      message: 'User updated',
      data: updatedUser,
    };
  };

  deleteUser = async (req, id) => {
    const user = await this.userRepository.findById(req, id);
    if (!user) {
      throw new HttpError(404, 'USER_NOT_FOUND', 'User not found');
    }

    await this.userRepository.delete(req, id);
    return { message: 'User deleted' };
  };

  assignRoles = async (req, userId, roleIds) => {
    const { models } = await import('../../../../shared/db/data-source.js');
    const user = await this.userRepository.findById(req, userId);
    if (!user) {
      throw new HttpError(404, 'USER_NOT_FOUND', 'User not found');
    }

    await user.setRoles(roleIds);
    const updatedUser = await this.userRepository.findByIdWithRoles(
      req,
      userId,
    );
    return {
      message: 'Roles assigned',
      data: updatedUser,
    };
  };

  /**
   * Enable PIN login for a user
   * @param {Object} req - Express request object
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Updated user data
   */
  enablePinLogin = async (req, userId) => {
    const user = await this.userRepository.findById(req, userId);
    if (!user) {
      throw new HttpError(404, 'USER_NOT_FOUND', 'User not found');
    }

    const updatedUser = await this.userRepository.update(req, userId, {
      allowPinLogin: true,
    });

    return {
      message: 'PIN login enabled successfully',
      data: updatedUser,
    };
  };

  /**
   * Disable PIN login for a user
   * @param {Object} req - Express request object
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Updated user data
   */
  disablePinLogin = async (req, userId) => {
    const user = await this.userRepository.findById(req, userId);
    if (!user) {
      throw new HttpError(404, 'USER_NOT_FOUND', 'User not found');
    }

    const updatedUser = await this.userRepository.update(req, userId, {
      allowPinLogin: false,
    });

    return {
      message: 'PIN login disabled successfully',
      data: updatedUser,
    };
  };
}
