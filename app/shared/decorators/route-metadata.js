/**
 * Route Metadata Decorators
 * 
 * Provides decorator-like functionality for Express routes
 * Similar to NestJS decorators but adapted for Express
 */

// Metadata keys
export const IGNORE_ORGANIZATION_INTERCEPTOR_KEY = 'ignoreOrganizationInterceptor';
export const ANONYMOUS_KEY = 'anonymous';
export const ORGANIZATION_API_KEY_INTERCEPTOR_KEY = 'organizationApiKeyInterceptor';
export const USER_INTERCEPTOR_KEY = 'userInterceptor';
export const IGNORE_ORGANIZATION_FILTER_KEY = 'ignoreOrganizationFilter';
export const FILTER_ORGANIZATION_WITH_CHILDREN_KEY =
  'filterOrganizationWithChildren';
export const FILTER_ORGANIZATION_WITH_CHILDREN_AND_SISTERS_KEY =
  'filterOrganizationWithChildrenAndSisters';

const routeRegistry = new Map();

/**
 * Get the route registry (for internal use)
 * @returns {Map} Route registry map
 */
export function getRouteRegistry() {
  return routeRegistry;
}

/**
 * Metadata storage for route handlers (fallback)
 * Maps handler functions to their metadata
 */
const routeMetadata = new WeakMap();

/**
 * Generate route key from method and path
 * @param {string} method - HTTP method
 * @param {string} path - Route path
 * @returns {string} Route key
 */
function getRouteKey(method, path) {
  return `${method.toUpperCase()}:${path}`;
}

/**
 * Register route metadata
 * @param {string} method - HTTP method
 * @param {string} path - Route path
 * @param {Object} metadata - Metadata to set
 */
export function registerRouteMetadata(method, path, metadata) {
  const key = getRouteKey(method, path);
  const existing = routeRegistry.get(key) || {};
  routeRegistry.set(key, { ...existing, ...metadata });
}

/**
 * Get metadata for a route
 * @param {string} method - HTTP method
 * @param {string} path - Route path
 * @returns {Object} Metadata object
 */
export function getRouteMetadata(method, path) {
  const key = getRouteKey(method, path);
  return routeRegistry.get(key) || {};
}

/**
 * Check if a path matches any registered route pattern with specific metadata
 * Handles parameterized routes (e.g., /path/:id or /path/{id})
 * @param {string} method - HTTP method
 * @param {string} actualPath - Actual request path
 * @param {string} metadataKey - Metadata key to check for
 * @returns {boolean} True if path matches a route with the metadata
 */
export function matchesRoutePattern(method, actualPath, metadataKey) {
  for (const [routeKey, metadata] of routeRegistry.entries()) {
    if (metadata[metadataKey]) {
      const [routeMethod, routePath] = routeKey.split(':');
      if (routeMethod === method) {
        // Convert pattern to regex (handle both :id and {id} formats)
        const patternRegex = routePath
          .replace(/\{[^}]+\}/g, '[^/]+') // Replace {id} with regex
          .replace(/:[^/]+/g, '[^/]+'); // Replace :id with regex
        const regex = new RegExp(`^${patternRegex}$`);
        if (regex.test(actualPath)) {
          return true;
        }
      }
    }
  }
  return false;
}

/**
 * Get metadata for a route handler (fallback)
 * @param {Function} handler - Route handler function
 * @returns {Object} Metadata object
 */
export function getHandlerMetadata(handler) {
  return routeMetadata.get(handler) || {};
}

/**
 * Set metadata for a route handler
 * @param {Function} handler - Route handler function
 * @param {Object} metadata - Metadata to set
 */
function setRouteMetadata(handler, metadata) {
  const existing = routeMetadata.get(handler) || {};
  routeMetadata.set(handler, { ...existing, ...metadata });
}

/**
 * Decorator: Ignore organization interceptor
 * Routes with this decorator will skip organization/branch filtering
 *
 * Usage:
 *   router.get('/', ignoreOrganizationInterceptor(controller.list))
 *
 * @param {Function} handler - Route handler function
 * @returns {Function} Decorated handler
 */
export function ignoreOrganizationInterceptor(handler) {
  setRouteMetadata(handler, { [IGNORE_ORGANIZATION_INTERCEPTOR_KEY]: true });
  return handler;
}

/**
 * Decorator: Anonymous route
 * Routes with this decorator don't require authentication
 *
 * Usage:
 *   router.post('/login', Anonymous(controller.login))
 *
 * @param {Function} handler - Route handler function
 * @returns {Function} Decorated handler
 */
export function Anonymous(handler) {
  setRouteMetadata(handler, { [ANONYMOUS_KEY]: true });
  return handler;
}

/**
 * Decorator: Organization API key interceptor
 * Routes with this decorator use API key authentication
 *
 * @param {Function} handler - Route handler function
 * @returns {Function} Decorated handler
 */
export function organizationApiKeyInterceptor(handler) {
  setRouteMetadata(handler, { [ORGANIZATION_API_KEY_INTERCEPTOR_KEY]: true });
  return handler;
}

/**
 * Decorator: User interceptor
 * Routes with this decorator filter by user ID (createdBy)
 *
 * @param {Function} handler - Route handler function
 * @returns {Function} Decorated handler
 */
export function userInterceptor(handler) {
  setRouteMetadata(handler, { [USER_INTERCEPTOR_KEY]: true });
  return handler;
}

/**
 * Decorator: Ignore organization filter
 * Routes/models with this decorator will skip organizationId filtering
 * Useful for schemas that don't have organizationId field or need cross-organization access
 *
 * Usage:
 *   router.get('/', ignoreOrganizationFilter(controller.list))
 *   // Or for models:
 *   Model.ignoreOrganizationFilter = true;
 *
 * @param {Function} handler - Route handler function (optional, can be used as model metadata)
 * @returns {Function|undefined} Decorated handler or undefined if used as model metadata
 */
export function ignoreOrganizationFilter(handler) {
  if (handler && typeof handler === 'function') {
    // Used as route decorator
    setRouteMetadata(handler, { [IGNORE_ORGANIZATION_FILTER_KEY]: true });

    // Wrap handler to set flag on request when called
    const wrappedHandler = async (req, res, next) => {
      // Set flag on request so repository can check it
      req.ignoreOrganizationFilter = true;
      // Call original handler
      return handler(req, res, next);
    };

    // Copy metadata to wrapped handler
    setRouteMetadata(wrappedHandler, {
      [IGNORE_ORGANIZATION_FILTER_KEY]: true,
    });

    return wrappedHandler;
  }
  // Can be used as model metadata: Model.ignoreOrganizationFilter = true
  return undefined;
}

/**
 * Check if a route has a specific metadata key
 * @param {string} method - HTTP method
 * @param {string} path - Route path
 * @param {string} key - Metadata key to check
 * @returns {boolean} True if metadata exists
 */
export function hasRouteMetadata(method, path, key) {
  const metadata = getRouteMetadata(method, path);
  return metadata[key] === true;
}

/**
 * Check if a handler has a specific metadata key
 * @param {Function} handler - Route handler function
 * @param {string} key - Metadata key to check
 * @returns {boolean} True if metadata exists
 */
export function hasMetadata(handler, key) {
  const metadata = getHandlerMetadata(handler);
  return metadata[key] === true;
}

/**
 * Decorator: Filter organization with children (including branches and sub-branches)
 * Routes with this decorator will filter data by organizationId and all its children
 * - If user's org is MAIN: filters by MAIN + all BRANCH + all SUB_BRANCH
 * - If user's org is BRANCH: filters by BRANCH + all SUB_BRANCH
 * - If user's org is SUB_BRANCH: filters by SUB_BRANCH only
 *
 * Useful for reports and data aggregation that needs hierarchical access
 *
 * Usage:
 *   router.get('/reports', filterOrganizationWithChildren(controller.getReports))
 *
 * @param {Function} handler - Route handler function
 * @returns {Function} Decorated handler
 */
export function filterOrganizationWithChildren(handler) {
  if (handler && typeof handler === 'function') {
    setRouteMetadata(handler, {
      [FILTER_ORGANIZATION_WITH_CHILDREN_KEY]: true,
    });

    // Wrap handler to set flag on request when called
    const wrappedHandler = async (req, res, next) => {
      // Set flag on request so repository can check it
      req.filterOrganizationWithChildren = true;
      return handler(req, res, next);
    };

    // Copy metadata to wrapped handler
    setRouteMetadata(wrappedHandler, {
      [FILTER_ORGANIZATION_WITH_CHILDREN_KEY]: true,
    });

    return wrappedHandler;
  }
  return undefined;
}

/**
 * Decorator: Filter organization with children and sisters (including branches, sub-branches, and sister orgs)
 * Routes with this decorator will filter data by:
 * - OrganizationId and all its children (MAIN -> BRANCH -> SUB_BRANCH)
 * - Sister organizations and all their children (branches and sub-branches)
 *
 * Useful for reports that need to aggregate data across related organizations
 *
 * Usage:
 *   router.get('/reports', filterOrganizationWithChildrenAndSisters(controller.getReports))
 *
 * @param {Function} handler - Route handler function
 * @returns {Function} Decorated handler
 */
export function filterOrganizationWithChildrenAndSisters(handler) {
  if (handler && typeof handler === 'function') {
    setRouteMetadata(handler, {
      [FILTER_ORGANIZATION_WITH_CHILDREN_AND_SISTERS_KEY]: true,
    });

    // Wrap handler to set flag on request when called
    const wrappedHandler = async (req, res, next) => {
      // Set flag on request so repository can check it
      req.filterOrganizationWithChildrenAndSisters = true;
      return handler(req, res, next);
    };

    // Copy metadata to wrapped handler
    setRouteMetadata(wrappedHandler, {
      [FILTER_ORGANIZATION_WITH_CHILDREN_AND_SISTERS_KEY]: true,
    });

    return wrappedHandler;
  }
  return undefined;
}

