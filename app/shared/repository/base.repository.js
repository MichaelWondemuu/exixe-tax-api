import { DataResponseFormat } from '../utils/response-formatter.js';
import { applyScopeFilters } from './scope-filtering.js';
import { Op } from 'sequelize';

/** Query-string keys that must never become SQL WHERE columns (pagination, sorting, etc.) */
const FIND_ALL_WHERE_META_KEYS = new Set([
  'page',
  'page_size',
  'pageSize',
  'limit',
  'offset',
  'skip',
  'take',
  'sort',
  'sort_by',
  'sort_order',
  'order',
  'orderBy',
  'search',
  'searchFields',
  'searchFrom',
  'search_from',
  'search_from_fields',
  'count',
  'relations',
  'include',
  'attributes',
]);

/**
 * Copy Sequelize `where` (including Symbol keys like Op.and) and drop HTTP meta keys.
 * @param {Object} where
 * @returns {Object}
 */
function sanitizeFindAllWhere(where) {
  if (!where || typeof where !== 'object') {
    return {};
  }
  const out = {};
  for (const key of Reflect.ownKeys(where)) {
    if (typeof key === 'string' && FIND_ALL_WHERE_META_KEYS.has(key)) {
      continue;
    }
    out[key] = where[key];
  }
  return out;
}

// Context keys for repository hooks
const ContextKeys = {
  USER_ID: 'userId',
  ACCOUNT_ID: 'accountId',
  ORGANIZATION_ID: 'organizationId',
  ORGANIZATION_NAME: 'organizationName',
  IS_SYSTEM: 'isSystem',
};

/**
 * Base Repository Interface/Abstract Class
 * Provides common CRUD operations for all repositories using Sequelize
 * Automatically applies scope-based filters for RBAC
 */
export class BaseRepository {
  constructor({ Model }) {
    if (!Model) {
      throw new Error('Model is required');
    }
    this.Model = Model;
  }

  /**
   * Find all records with automatic scope filtering
   * @param {Object} req - Express request object (for scope context)
   * @param {Object} options - Find options (where, order, include, etc.)
   * @param {Object} queryParams - Query parameters (count, limit, offset, etc.)
   * @returns {Promise<DataResponseFormat>}
   */
  async findAll(req, options = {}, queryParams = null) {
    // Apply scope filters automatically (pass Model for decorator checks)
    const scopedOptions = await applyScopeFilters(
      req,
      {
        where: options.where || queryParams?.where || {},
        order: options.order || queryParams?.order,
        include: options.include || queryParams?.include || [],
        attributes: options.attributes || queryParams?.attributes,
      },
      this.Model
    );

    // Standardize pagination parameters
    const pageSize = queryParams?.page_size
      ? Number(queryParams.page_size)
      : queryParams?.limit || queryParams?.take;
    const page = queryParams?.page ? Number(queryParams.page) : 1;
    const limit = pageSize;
    const offset = queryParams?.offset || (limit && page ? (page - 1) * limit : queryParams?.skip);

    // Standardize sorting parameters
    let order = scopedOptions.order || options.order;
    if (!order && queryParams?.sort_by) {
      const sortOrder = (queryParams.sort_order || 'ASC').toUpperCase();
      order = [[queryParams.sort_by, sortOrder]];
    }

    // Apply generic text search across fields
    let where = sanitizeFindAllWhere(scopedOptions.where || {});
    const rawSearch = queryParams?.search;
    const hasSearch =
      rawSearch !== undefined &&
      rawSearch !== null &&
      String(rawSearch).trim() !== '';

    if (hasSearch) {
      const search = String(rawSearch).trim();
      const rawSearchFrom =
        queryParams.searchFrom || queryParams.search_from || queryParams.search_from_fields;

      let searchFields = [];
      if (typeof rawSearchFrom === 'string' && rawSearchFrom.trim() !== '') {
        searchFields = rawSearchFrom
          .split(',')
          .map((f) => f.trim())
          .filter((f) => f.length > 0);
      }

      // Default to `name` when no fields are specified
      if (searchFields.length === 0) {
        searchFields = ['name'];
      }

      const orClauses = searchFields.map((field) => ({
        [field]: {
          [Op.iLike]: `%${search}%`,
        },
      }));

      if (orClauses.length > 0) {
        if (where && Object.keys(where).length > 0) {
          where = {
            [Op.and]: [where, { [Op.or]: orClauses }],
          };
        } else {
          where = { [Op.or]: orClauses };
        }
      }
    }

    const findOptions = {
      where,
      order: this._convertOrder(order),
      include: scopedOptions.include || options.include || [],
      attributes: scopedOptions.attributes || options.attributes,
      limit: limit,
      offset: offset,
      distinct: true,
      subQuery: options.subQuery !== undefined ? options.subQuery : undefined,
    };

    // Remove undefined values
    Object.keys(findOptions).forEach(
      (key) => findOptions[key] === undefined && delete findOptions[key]
    );
    if (queryParams?.count) {
      return {
        count: await this.Model.count(findOptions),
      };
    }
    const { count, rows } = await this.Model.findAndCountAll(findOptions);
    return DataResponseFormat.from(rows, count);
  }

  /**
   * Find one record by ID with automatic scope filtering
   * @param {Object} req - Express request object (for scope context)
   * @param {string|number} id - Record ID
   * @param {Object} options - Find options (include, attributes, etc.)
   * @returns {Promise<Object|null>}
   */
  async findById(req, id, options = {}) {
    // Apply scope filters automatically (pass Model for decorator checks)
    const scopedOptions = await applyScopeFilters(
      req,
      {
        where: { id },
        include: options.include || [],
        attributes: options.attributes,
      },
      this.Model
    );

    return this.Model.findOne({
      where: scopedOptions.where,
      include: scopedOptions.include || [],
      attributes: scopedOptions.attributes,
    });
  }

  /**
   * Find one record by a single key-value with automatic scope filtering
   * @param {Object} req - Express request object (for scope context)
   * @param {string} key - Field name to match (e.g. 'name', 'code', 'email')
   * @param {*} value - Value to match
   * @param {Object} options - Additional find options (include, attributes)
   * @returns {Promise<Object|null>}
   */
  async findByKey(req, key, value, options = {}) {
    return this.findOne(req, { [key]: value }, options);
  }

  async findManyByKey(req, key, value, options = {}) {
    return this.findMany(req, { [key]: value }, options);
  }

  /**
   * Find one record by criteria with automatic scope filtering
   * @param {Object} req - Express request object (for scope context)
   * @param {Object} criteria - Where criteria
   * @param {Object} options - Additional find options
   * @returns {Promise<Object|null>}
   */
  async findOne(req, criteria = {}, options = {}) {
    // Apply scope filters automatically (pass Model for decorator checks)
    const scopedOptions = await applyScopeFilters(
      req,
      {
        where: criteria,
        include: options.include || [],
        attributes: options.attributes,
      },
      this.Model
    );

    return this.Model.findOne({
      ...options,
      where: scopedOptions.where,
      include: scopedOptions.include || [],
      attributes: scopedOptions.attributes,
    });
  }

  /**
   * Find multiple records by criteria with automatic scope filtering
   * @param {Object} req - Express request object (for scope context)
   * @param {Object} criteria - Where criteria
   * @param {Object} options - Additional find options
   * @returns {Promise<Array>}
   */
  async findMany(req, criteria, options = {}) {
    // Apply scope filters automatically (pass Model for decorator checks)
    const scopedOptions = await applyScopeFilters(
      req,
      {
        where: criteria,
        order: options.order,
        include: options.include || [],
        attributes: options.attributes,
      },
      this.Model
    );

    return this.Model.findAll({
      where: scopedOptions.where,
      order: this._convertOrder(scopedOptions.order || options.order),
      include: scopedOptions.include || [],
      attributes: scopedOptions.attributes,
      limit: options.limit,
      offset: options.offset,
    });
  }

  /**
   * Create a new record with automatic context injection
   * @param {Object} req - Express request object (for user context)
   * @param {Object} data - Entity data
   * @returns {Promise<Object>}
   */
  async create(req, data) {
    // Inject user context (createdBy, updatedBy, organizationId) if not provided
    const enrichedData = { ...data };
  
    // Handle null req gracefully (e.g., for system operations)
    if (req) {
      const accountId = req[ContextKeys.ACCOUNT_ID] ?? req[ContextKeys.USER_ID];
      if (accountId) {
        if (!enrichedData.createdBy) {
          enrichedData.createdBy = accountId;
        }
        if (!enrichedData.updatedBy) {
          enrichedData.updatedBy = accountId;
        }
      }

      const isSystem = req[ContextKeys.IS_SYSTEM] === true;
      if (!isSystem && this.Model.ignoreOrganizationFilter !== true) {
        delete enrichedData.organizationId;
        const organizationId = req[ContextKeys.ORGANIZATION_ID];
        if (organizationId) {
          enrichedData.organizationId = organizationId;
        }
      }
    }

    return this.Model.create(enrichedData);
  }

  /**
   * Create multiple records
   * @param {Array<Object>} dataArray - Array of entity data
   * @returns {Promise<Array>}
   */
  async createMany(dataArray) {
    return this.Model.bulkCreate(dataArray, { returning: true });
  }

  /**
   * Update a record by ID with automatic scope filtering and context injection
   * @param {Object} req - Express request object (for scope context)
   * @param {string|number} id - Record ID
   * @param {Object} data - Update data
   * @returns {Promise<Object>}
   */
  async update(req, id, data) {
    // Apply scope filters to ensure user can only update their scope (pass Model for decorator checks)
    const scopedOptions = await applyScopeFilters(
      req,
      {
        where: { id },
      },
      this.Model
    );

    // Inject updatedBy, organizationId if not provided
    const enrichedData = { ...data };
    const accountId = req[ContextKeys.ACCOUNT_ID] ?? req[ContextKeys.USER_ID];
    if (accountId && !enrichedData.updatedBy) {
      enrichedData.updatedBy = accountId;
    }

    const isSystem = req[ContextKeys.IS_SYSTEM] === true;
    if (!isSystem && this.Model.ignoreOrganizationFilter !== true) {
      const organizationId = req[ContextKeys.ORGANIZATION_ID];
      if (organizationId && !enrichedData.organizationId) {
        enrichedData.organizationId = organizationId;
      }
    }

    const [affectedRows] = await this.Model.update(enrichedData, {
      where: scopedOptions.where,
      returning: true,
    });
    if (affectedRows === 0) {
      return null;
    }
    return this.findById(req, id);
  }

  /**
   * Update multiple records by criteria
   * @param {Object} criteria - Where criteria
   * @param {Object} data - Update data
   * @returns {Promise<number>} Number of affected rows
   */
  async updateMany(criteria, data) {
    const [affectedRows] = await this.Model.update(data, {
      where: criteria,
    });
    return affectedRows;
  }

  /**
   * Delete a record by ID (hard delete) with automatic scope filtering
   * @param {Object} req - Express request object (for scope context)
   * @param {string|number} id - Record ID
   * @returns {Promise<boolean>}
   */
  async delete(req, id) {
    // Apply scope filters to ensure user can only delete their scope (pass Model for decorator checks)
    const scopedOptions = await applyScopeFilters(
      req,
      {
        where: { id },
      },
      this.Model
    );

    const deletedRows = await this.Model.destroy({
      where: scopedOptions.where,
      force: true,
    });
    return deletedRows > 0;
  }

  /**
   * Soft delete a record by ID (sets deletedAt) with automatic scope filtering
   * @param {Object} req - Express request object (for scope context)
   * @param {string|number} id - Record ID
   * @returns {Promise<boolean>}
   */
  async softDelete(req, id) {
    // Apply scope filters to ensure user can only delete their scope (pass Model for decorator checks)
    const scopedOptions = await applyScopeFilters(
      req,
      {
        where: { id },
      },
      this.Model
    );

    const deletedRows = await this.Model.destroy({
      where: scopedOptions.where,
    });
    return deletedRows > 0;
  }

  /**
   * Restore a soft-deleted record
   * @param {string|number} id - Record ID
   * @returns {Promise<boolean>}
   */
  async restore(id) {
    const restored = await this.Model.restore({
      where: { id },
    });
    return restored > 0;
  }

  /**
   * Count records matching criteria with automatic scope filtering
   * @param {Object} req - Express request object (for scope context)
   * @param {Object} criteria - Where criteria (optional)
   * @returns {Promise<number>}
   */
  async count(req, criteria = {}) {
    // Apply scope filters automatically (pass Model for decorator checks)
    const scopedOptions = await applyScopeFilters(
      req,
      {
        where: criteria,
      },
      this.Model
    );

    return this.Model.count({
      where: scopedOptions.where,
    });
  }

  /**
   * Check if a record exists with automatic scope filtering
   * @param {Object} req - Express request object (for scope context)
   * @param {Object} criteria - Where criteria
   * @returns {Promise<boolean>}
   */
  async exists(req, criteria) {
    // Apply scope filters automatically (pass Model for decorator checks)
    const scopedOptions = await applyScopeFilters(
      req,
      {
        where: criteria,
      },
      this.Model
    );

    const count = await this.Model.count({ where: scopedOptions.where });
    return count > 0;
  }

  /**
   * Get the Sequelize model instance for advanced operations
   * @returns {Model}
   */
  getModel() {
    return this.Model;
  }

  /**
   * Convert TypeORM-style order to Sequelize order format
   * @private
   * @param {Object} order - Order object like { createdAt: 'DESC', name: 'ASC' }
   * @returns {Array} Sequelize order array
   */
  _convertOrder(order) {
    if (!order) return undefined;
    if (Array.isArray(order)) return order;
    return Object.entries(order).map(([field, direction]) => [
      field,
      direction,
    ]);
  }
}
