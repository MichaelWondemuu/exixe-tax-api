import { HttpError } from '../../../../shared/utils/http-error.js';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../../../shared/logger/logger.js';

export class ResourceService {
  constructor({ resourceRepository, permissionRepository }) {
    this.resourceRepository = resourceRepository;
    this.permissionRepository = permissionRepository;
  }

  listResources = async (req, queryParams) => {
    const result = await this.resourceRepository.findAll(req, {}, queryParams);
    return result;
  };

  getResource = async (req, id) => {
    const resource = await this.resourceRepository.findById(req, id);
    if (!resource) {
      throw new HttpError(404, 'RESOURCE_NOT_FOUND', 'Resource not found');
    }
    return { data: resource };
  };

  createResource = async (req, data) => {
    const resource = await this.resourceRepository.create(req, {
      key: data.key,
      name: data.name,
    });
    const { models } = await import('../../../../shared/db/data-source.js');

    const defaultPermissionsResult = await this.permissionRepository.findAll(
      req,
      { where: { isDefault: true } },
      {},
    );
    const defaultPermissions = defaultPermissionsResult?.data || [];

    const createdResourcePermissions = [];
    for (const permission of defaultPermissions) {
      const code = `${resource.key}:${permission.code}`;
      const rp = await models.resourcePermission.create({
        id: uuidv4(),
        resourceId: resource.id,
        permissionId: permission.id,
        code: code,
      });
      createdResourcePermissions.push(rp);
    }

    logger.info(
      `Created ${createdResourcePermissions.length} resource permissions for resource: ${resource.key}`,
    );

    const adminRole = await models.Role.findOne({
      where: { name: 'admin', isSystem: true },
    });

    if (adminRole && createdResourcePermissions.length > 0) {
      const manageAllPermission = createdResourcePermissions.find(
        (rp) => rp.code === `${resource.key}:ma`,
      );

      if (manageAllPermission) {
        await adminRole.addResourcePermissions([manageAllPermission.id]);

        logger.info(
          `Assigned manage permission (${manageAllPermission.code}) to admin role`,
        );
      } else {
        logger.warn(
          `Manage permission (${resource.key}:ma) not found. Resource permissions created but not assigned to admin role.`,
        );
      }
    } else if (!adminRole) {
      logger.warn(
        'Admin role not found. Resource permissions created but not assigned to admin role.',
      );
    }
    return {
      message: 'Resource created',
      data: resource,
    };
  };

  updateResource = async (req, id, data) => {
    const resource = await this.resourceRepository.findById(req, id);
    if (!resource) {
      throw new HttpError(404, 'RESOURCE_NOT_FOUND', 'Resource not found');
    }

    const updateData = {};
    updateData.key = data.key;
    if (data.name !== undefined) updateData.name = data.name;

    const updatedResource = await this.resourceRepository.update(
      req,
      id,
      updateData,
    );
    return {
      message: 'Resource updated',
      data: updatedResource,
    };
  };

  deleteResource = async (req, id) => {
    const resource = await this.resourceRepository.findById(req, id);
    if (!resource) {
      throw new HttpError(404, 'RESOURCE_NOT_FOUND', 'Resource not found');
    }

    await this.resourceRepository.delete(req, id);
    return { message: 'Resource deleted' };
  };
}
