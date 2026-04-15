/**
 * Organization Filtering Utilities
 * 
 * Applies organization-based filters to Sequelize queries based on context
 * set by authentication middleware.
 * 
 * Filtering rules:
 *   - SYSTEM users: No filters applied (global access)
 *   - Regular users: Filter by organization_id
 */

import {
  hasMetadata,
  matchesRoutePattern,
  IGNORE_ORGANIZATION_FILTER_KEY,
  FILTER_ORGANIZATION_WITH_CHILDREN_KEY,
  FILTER_ORGANIZATION_WITH_CHILDREN_AND_SISTERS_KEY,
} from '../decorators/route-metadata.js';
import { Op } from 'sequelize';

// Context keys for repository hooks
const ContextKeys = {
  USER_ID: 'userId',
  ORGANIZATION_ID: 'organizationId',
  ORGANIZATION_NAME: 'organizationName',
  IS_SYSTEM: 'isSystem',
};

function shouldIgnoreOrganizationFilter(req, Model = null) {
  if (!req || typeof req !== 'object') {
    return true;
  }
  if (req.ignoreOrganizationFilter === true) {
    return true;
  }

  // Check handler metadata from request route stack
  if (req.route && req.route.stack && req.route.stack.length > 0) {
    // Check the last handler in the stack (the actual route handler)
    for (let i = req.route.stack.length - 1; i >= 0; i--) {
      const layer = req.route.stack[i];
      if (layer && layer.handle && typeof layer.handle === 'function') {
        if (hasMetadata(layer.handle, IGNORE_ORGANIZATION_FILTER_KEY)) {
          return true;
        }
      }
    }
  }

  // Check route metadata by matching the request path (if routes are registered)
  if (req.method && req.path) {
    if (
      matchesRoutePattern(req.method, req.path, IGNORE_ORGANIZATION_FILTER_KEY)
    ) {
      return true;
    }
  }

  // Check model metadata
  if (Model && Model.ignoreOrganizationFilter === true) {
    return true;
  }

  return false;
}

/**
 * Recursively gets all child organization IDs (including nested children)
 * @param {string} parentId - Parent organization ID
 * @param {Object} models - Sequelize models
 * @returns {Promise<string[]>} Array of organization IDs (including parent)
 */
async function getAllChildOrganizationIds(parentId, models) {
  const organizationIds = [parentId];

  // Get direct children
  const children = await models.Organization.findAll({
    where: { parentId: parentId },
    attributes: ['id'],
  });

  // Recursively get children of children
  for (const child of children) {
    const childIds = await getAllChildOrganizationIds(child.id, models);
    organizationIds.push(...childIds);
  }

  return organizationIds;
}

/**
 * Gets all organization IDs including children and sister organizations
 * @param {string} organizationId - Base organization ID
 * @param {Object} models - Sequelize models
 * @returns {Promise<string[]>} Array of organization IDs
 */
async function getOrganizationIdsWithSisters(organizationId, models) {
  const organizationIds = new Set([organizationId]);

  // Get the organization with its relationships
  const org = await models.Organization.findByPk(organizationId, {
    include: [
      { model: models.Organization, as: 'children', required: false },
      {
        model: models.Organization,
        as: 'sisterOrganizations',
        required: false,
      },
    ],
  });

  if (!org) {
    return [organizationId];
  }

  // Add all children (recursively)
  const childIds = await getAllChildOrganizationIds(organizationId, models);
  childIds.forEach((id) => organizationIds.add(id));

  // Add sister organizations and their children
  if (org.sisterOrganizations && org.sisterOrganizations.length > 0) {
    for (const sister of org.sisterOrganizations) {
      organizationIds.add(sister.id);
      // Get children of sister organizations
      const sisterChildIds = await getAllChildOrganizationIds(
        sister.id,
        models
      );
      sisterChildIds.forEach((id) => organizationIds.add(id));
    }
  }

  return Array.from(organizationIds);
}

/**
 * Checks if hierarchical organization filter should be applied
 * @param {Object} req - Express request object
 * @returns {boolean} True if hierarchical filter should be applied
 */
function shouldApplyHierarchicalFilter(req) {
  // Check request-level flags
  if (req.filterOrganizationWithChildren === true) {
    return 'children';
  }
  if (req.filterOrganizationWithChildrenAndSisters === true) {
    return 'children_and_sisters';
  }

  // Check handler metadata from request route stack
  if (req.route && req.route.stack && req.route.stack.length > 0) {
    for (let i = req.route.stack.length - 1; i >= 0; i--) {
      const layer = req.route.stack[i];
      if (layer && layer.handle && typeof layer.handle === 'function') {
        if (
          hasMetadata(
            layer.handle,
            FILTER_ORGANIZATION_WITH_CHILDREN_AND_SISTERS_KEY
          )
        ) {
          return 'children_and_sisters';
        }
        if (hasMetadata(layer.handle, FILTER_ORGANIZATION_WITH_CHILDREN_KEY)) {
          return 'children';
        }
      }
    }
  }

  // Check route metadata by matching the request path
  if (req.method && req.path) {
    if (
      matchesRoutePattern(
        req.method,
        req.path,
        FILTER_ORGANIZATION_WITH_CHILDREN_AND_SISTERS_KEY
      )
    ) {
      return 'children_and_sisters';
    }
    if (
      matchesRoutePattern(
        req.method,
        req.path,
        FILTER_ORGANIZATION_WITH_CHILDREN_KEY
      )
    ) {
      return 'children';
    }
  }

  return false;
}

/**
 * Applies organization-based filters to a Sequelize query based on request context
 *
 * @param {Object} req - Express request object (contains user context)
 * @param {Object} queryOptions - Sequelize query options (where, include, etc.)
 * @param {Object} Model - Sequelize model (optional, for model-level decorator checks)
 * @returns {Promise<Object>} Modified query options with organization filters applied
 */
export async function applyScopeFilters(req, queryOptions = {}, Model = null) {
  if (!req || typeof req !== 'object') {
    return queryOptions;
  }
  // Initialize where clause if not present
  if (!queryOptions.where) {
    queryOptions.where = {};
  }

  // Check if filters should be ignored
  const ignoreOrgFilter = shouldIgnoreOrganizationFilter(req, Model);

  // System users: no filters (global access)
  const isSystem = req[ContextKeys.IS_SYSTEM] === true;
  if (isSystem) {
    return queryOptions;
  }

  // Organization scoping for non-system users
  if (!ignoreOrgFilter) {
    const organizationId = req[ContextKeys.ORGANIZATION_ID];
    if (organizationId) {
      // Check for hierarchical filtering
      const hierarchicalFilter = shouldApplyHierarchicalFilter(req);

      if (hierarchicalFilter) {
        // Import models dynamically to avoid circular dependencies
        const { models } = await import('../../shared/db/data-source.js');

        let organizationIds;
        if (hierarchicalFilter === 'children_and_sisters') {
          // Get organization IDs including children and sister organizations
          organizationIds = await getOrganizationIdsWithSisters(
            organizationId,
            models
          );
        } else {
          // Get organization IDs including only children
          organizationIds = await getAllChildOrganizationIds(
            organizationId,
            models
          );
        }

        // Filter by multiple organization IDs
        queryOptions.where.organizationId = {
          [Op.in]: organizationIds,
        };
      } else {
        // Standard filtering: only current organization
        queryOptions.where.organizationId = organizationId;
      }
    }
  }

  return queryOptions;
}

/**
 * Creates a scoped query options object
 * Wrapper that automatically applies organization filters
 *
 * @param {Object} req - Express request object
 * @param {Object} baseOptions - Base query options
 * @param {Object} Model - Sequelize model (optional, for model-level decorator checks)
 * @returns {Promise<Object>} Query options with organization filters applied
 */
export async function scopedQueryOptions(req, baseOptions = {}, Model = null) {
  return await applyScopeFilters(req, { ...baseOptions }, Model);
}

