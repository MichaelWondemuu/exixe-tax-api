import { models } from '../../../../shared/db/data-source.js';
import { fn, col } from 'sequelize';

/**
 * Service for generating system-level reports.
 * Used by system users only (via /system/user-report).
 */
export class SystemReportService {
  /**
   * Get system user report: counts, all orgs (including zero users), hierarchy views.
   * @returns {Promise<Object>} Report payload
   */
  async getSystemUserReport() {
    const [
      allOrgs,
      userCountRows,
      roleCountRows,
      totalUsers,
      systemUsersCount,
      totalRoles,
      totalPermissions,
      totalResources,
      totalResourcePermissions,
    ] = await Promise.all([
      this._getAllOrganizations(),
      this._getUserCountByOrganization(),
      this._getRoleCountByOrganization(),
      this._countUsers(),
      this._countSystemUsers(),
      this._countRoles(),
      this._countPermissions(),
      this._countResources(),
      this._countResourcePermissions(),
    ]);

    const totalOrganizations = allOrgs.length;
    const userCountMap = new Map(
      (userCountRows || []).map((r) => [r.organizationId, Number(r.userCount)]),
    );
    const roleCountMap = new Map(
      (roleCountRows || []).map((r) => [r.organizationId, Number(r.roleCount)]),
    );

    const allOrganizations = allOrgs.map((org) => ({
      id: org.id,
      name: org.name,
      organizationType: org.organizationType,
      parentId: org.parentId,
      isActive: org.isActive,
      tenantId: org.tenantId ?? null,
      userCount: userCountMap.get(org.id) ?? 0,
      roleCount: roleCountMap.get(org.id) ?? 0,
    }));

    const byType = { MAIN: 0, BRANCH: 0, SUB_BRANCH: 0, SISTER: 0 };
    const byStatus = { active: 0, inactive: 0 };
    allOrgs.forEach((org) => {
      if (byType[org.organizationType] !== undefined) byType[org.organizationType]++;
      if (org.isActive) byStatus.active++;
      else byStatus.inactive++;
    });

    const hierarchyWithSisters = this._buildHierarchyWithSisters(
      allOrgs,
      userCountMap,
      roleCountMap,
    );

    const hierarchyMainOnly = this._buildHierarchyMainOnly(
      allOrgs,
      userCountMap,
      roleCountMap,
    );

    return {
      summary: {
        totalOrganizations,
        totalUsers,
        systemUsersCount,
        organizationUsersCount: totalUsers - systemUsersCount,
        totalRoles,
        totalPermissions,
        totalResources,
        totalResourcePermissions,
        byOrganizationType: byType,
        byStatus,
      },
      allOrganizations,
      hierarchy: {
        mainAndSisters: hierarchyWithSisters,
        mainOnly: hierarchyMainOnly,
      },
      generatedAt: new Date().toISOString(),
    };
  }

  _toNode(org, userCountMap, roleCountMap) {
    return {
      id: org.id,
      name: org.name,
      organizationType: org.organizationType,
      parentId: org.parentId,
      isActive: org.isActive,
      tenantId: org.tenantId ?? null,
      userCount: userCountMap.get(org.id) ?? 0,
      roleCount: roleCountMap.get(org.id) ?? 0,
      children: [],
    };
  }

  _buildHierarchyMainOnly(allOrgs, userCountMap, roleCountMap) {
    const byId = new Map(allOrgs.map((o) => [o.id, o]));
    const roots = allOrgs.filter(
      (o) => !o.parentId && o.organizationType !== 'SISTER',
    );
    const nodeMap = new Map();
    allOrgs.forEach((org) => {
      nodeMap.set(org.id, this._toNode(org, userCountMap, roleCountMap));
    });
    roots.forEach((root) => {
      const node = nodeMap.get(root.id);
      if (!node) return;
      this._attachChildren(node, nodeMap, byId, false);
    });
    return roots.map((r) => nodeMap.get(r.id)).filter(Boolean);
  }

  _buildHierarchyWithSisters(allOrgs, userCountMap, roleCountMap) {
    const byId = new Map(allOrgs.map((o) => [o.id, o]));
    const nodeMap = new Map();
    allOrgs.forEach((org) => {
      nodeMap.set(org.id, this._toNode(org, userCountMap, roleCountMap));
    });

    const mainRoots = allOrgs.filter(
      (o) => !o.parentId && o.organizationType !== 'SISTER',
    );
    mainRoots.forEach((root) => {
      const node = nodeMap.get(root.id);
      if (!node) return;
      this._attachChildren(node, nodeMap, byId, false);
    });
    const mainTree = mainRoots.map((r) => nodeMap.get(r.id)).filter(Boolean);

    const sisterOrgs = allOrgs.filter((o) => o.organizationType === 'SISTER');
    const sisterTrees = sisterOrgs
      .map((org) => {
        const node = nodeMap.get(org.id);
        if (!node) return null;
        this._attachChildren(node, nodeMap, byId, true);
        return node;
      })
      .filter(Boolean);

    return {
      mainTree,
      sisterOrganizations: sisterTrees,
    };
  }

  _attachChildren(node, nodeMap, byId, includeSisterChildren) {
    const children = [...byId.values()].filter(
      (o) =>
        o.parentId === node.id &&
        (includeSisterChildren || o.organizationType !== 'SISTER'),
    );
    node.children = children.map((c) => nodeMap.get(c.id)).filter(Boolean);
    node.children.forEach((child) =>
      this._attachChildren(child, nodeMap, byId, includeSisterChildren),
    );
  }

  async _getAllOrganizations() {
    const list = await models.Organization.findAll({
      where: { deletedAt: null },
      attributes: [
        'id',
        'name',
        'organizationType',
        'parentId',
        'isActive',
        'tenantId',
      ],
      raw: true,
      order: [
        ['organizationType', 'ASC'],
        ['name', 'ASC'],
      ],
    });
    return list;
  }

  async _getUserCountByOrganization() {
    const rows = await models.User.findAll({
      attributes: [
        'organizationId',
        [fn('COUNT', col('id')), 'userCount'],
      ],
      where: { deletedAt: null, isSystem: false },
      group: ['organizationId'],
      raw: true,
    });
    return rows;
  }

  async _getRoleCountByOrganization() {
    const rows = await models.Role.findAll({
      attributes: [
        'organizationId',
        [fn('COUNT', col('id')), 'roleCount'],
      ],
      where: { deletedAt: null },
      group: ['organizationId'],
      raw: true,
    });
    return rows;
  }

  async _countUsers() {
    return models.User.count({
      where: { deletedAt: null },
    });
  }

  async _countSystemUsers() {
    return models.User.count({
      where: { deletedAt: null, isSystem: true },
    });
  }

  async _countRoles() {
    return models.Role.count({
      where: { deletedAt: null },
    });
  }

  async _countPermissions() {
    return models.Permission.count({
      where: { deletedAt: null },
    });
  }

  async _countResources() {
    return models.Resource.count({
      where: { deletedAt: null },
    });
  }

  async _countResourcePermissions() {
    return models.resourcePermission.count();
  }
}
