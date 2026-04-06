/**
 * Parse query parameters from request
 * Extracts common query parameters for filtering, pagination, and formatting
 * @param {Object} req - Express request object
 * @returns {Object} Parsed query parameters
 */
export function parseQueryParams(req) {
  const query = req.query || {};
  
  return {
    count: query.count === 'true' || query.count === true,
    // Pagination (also read by BaseRepository.findAll)
    skip: query.skip ? parseInt(query.skip, 10) : undefined,
    take: query.take ? parseInt(query.take, 10) : undefined,
    page: query.page ? parseInt(query.page, 10) : undefined,
    limit: query.limit ? parseInt(query.limit, 10) : undefined,
    page_size: query.page_size ? parseInt(query.page_size, 10) : undefined,
    offset: query.offset ? parseInt(query.offset, 10) : undefined,
    sort_by: query.sort_by,
    sort_order: query.sort_order,
    where: buildWhereConditions(query),
    order: buildOrderConditions(query),
    relations: query.relations ? (Array.isArray(query.relations) ? query.relations : [query.relations]) : undefined,
    search: query.search,
    searchFields: query.searchFields ? (Array.isArray(query.searchFields) ? query.searchFields : [query.searchFields]) : undefined
  };
}

/**
 * Build where conditions from query parameters
 * @param {Object} query - Query object
 * @returns {Object} Where conditions
 */
function buildWhereConditions(query) {
  const where = {};

  // Must exclude every key BaseRepository / list APIs use so they are not sent as SQL columns
  const excludeKeys = [
    'count',
    'skip',
    'take',
    'page',
    'limit',
    'page_size',
    'offset',
    'order',
    'orderBy',
    'relations',
    'search',
    'searchFields',
    'sort',
    'sort_by',
    'sort_order',
    'searchFrom',
    'search_from',
    'search_from_fields',
    'include',
    'attributes',
  ];
  
  Object.keys(query).forEach(key => {
    if (!excludeKeys.includes(key) && query[key] !== undefined && query[key] !== null && query[key] !== '') {
      where[key] = query[key];
    }
  });
  
  return Object.keys(where).length > 0 ? where : undefined;
}

/**
 * Build order conditions from query parameters
 * @param {Object} query - Query object
 * @returns {Object} Order conditions
 */
function buildOrderConditions(query) {
  if (query.order || query.orderBy || query.sort) {
    const orderBy = query.order || query.orderBy || query.sort;
    
    if (typeof orderBy === 'string') {
      // Single field: ?order=createdAt:DESC or ?order=createdAt
      const [field, direction] = orderBy.split(':');
      return {
        [field]: direction?.toUpperCase() || 'ASC'
      };
    } else if (typeof orderBy === 'object') {
      // Object: ?order[createdAt]=DESC
      return orderBy;
    }
  }
  
  // Default order
  return { createdAt: 'DESC' };
}

/**
 * Calculate skip and take from page and limit
 * @param {number} page - Page number (1-based)
 * @param {number} limit - Items per page
 * @returns {Object} Object with skip and take
 */
export function calculatePagination(page, limit) {
  if (!page || !limit) {
    return { skip: undefined, take: undefined };
  }
  
  const skip = (page - 1) * limit;
  const take = limit;
  
  return { skip, take };
}
