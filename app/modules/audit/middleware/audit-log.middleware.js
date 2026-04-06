/**
 * Audit log middleware - records every request and response.
 * Works for both authenticated and public (unauthenticated) requests.
 */
import { logger } from '../../../shared/logger/logger.js';
const SENSITIVE_KEYS = [
  'password',
  'pin',
  'currentPin',
  'newPin',
  'confirmPin',
  'token',
  'accessToken',
  'refreshToken',
  'secret',
  'authorization',
];

const MAX_RESPONSE_BODY_LENGTH = 10000; // 10k chars
const MAX_REQUEST_BODY_LENGTH = 50000;  // 50k chars for request

/**
 * Derive module name from path (e.g. /v1/sales/orders -> sales)
 * @param {string} path - Full path e.g. /v1/sales/orders
 * @returns {string|null}
 */
function getModuleFromPath(path) {
  if (!path || typeof path !== 'string') return null;
  const segments = path.replace(/^\/+/, '').split('/');
  // /v1/sales/... -> sales; /v1/auth/login -> auth
  if (segments.length >= 2) return segments[1];
  if (segments.length === 1 && segments[0]) return segments[0];
  return null;
}

/**
 * Shallow clone and redact sensitive keys (recursive for nested objects).
 * @param {*} obj
 * @returns {*}
 */
function sanitizeBody(obj) {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeBody);

  const out = {};
  for (const [key, value] of Object.entries(obj)) {
    const lower = key.toLowerCase();
    if (SENSITIVE_KEYS.some((s) => lower.includes(s.toLowerCase()))) {
      out[key] = '[REDACTED]';
    } else {
      out[key] = sanitizeBody(value);
    }
  }
  return out;
}

/**
 * Truncate string for storage.
 * @param {string} str
 * @param {number} maxLen
 * @returns {string}
 */
function truncate(str, maxLen) {
  if (str == null) return '';
  const s = typeof str === 'string' ? str : JSON.stringify(str);
  if (s.length <= maxLen) return s;
  return s.slice(0, maxLen) + '...[truncated]';
}

/**
 * Get client IP from request (supports x-forwarded-for behind proxy).
 * @param {import('express').Request} req
 * @returns {string}
 */
function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const first = typeof forwarded === 'string' ? forwarded.split(',')[0] : forwarded[0];
    return (first || '').trim() || req.ip || req.socket?.remoteAddress || '';
  }
  return req.ip || req.socket?.remoteAddress || '';
}

/**
 * Build audit payload from req/res. Call this in res.on('finish') so response is done.
 * @param {import('express').Request} req - with auditStartTime and captured response
 * @param {import('express').Response} res
 */
function buildAuditPayload(req, res) {
  const path = (req.baseUrl || '') + (req.path || '') || req.url || '';
  const method = (req.method || '').toUpperCase();
  const moduleName = getModuleFromPath(path);

  let requestBody = null;
  if (req.body !== undefined && req.body !== null && Object.keys(req.body).length > 0) {
    const sanitized = sanitizeBody(req.body);
    const str = JSON.stringify(sanitized);
    requestBody = str.length <= MAX_REQUEST_BODY_LENGTH ? sanitized : truncate(str, MAX_REQUEST_BODY_LENGTH);
  }

  let responseBody = null;
  if (res._auditResponseBody !== undefined) {
    responseBody = truncate(res._auditResponseBody, MAX_RESPONSE_BODY_LENGTH);
  }

  const user = req.user || null;
  const userId = user?.userId ?? null;
  const username = user
    ? [user.firstname, user.lastname].filter(Boolean).join(' ').trim() || user.phone || user.userId
    : null;
  const organizationId = user?.organization?.id ?? null;

  const startTime = req._auditStartTime;
  const durationMs = startTime != null ? Math.round(Date.now() - startTime) : null;

  return {
    method,
    path,
    module: moduleName,
    query: Object.keys(req.query || {}).length > 0 ? req.query : null,
    requestBody,
    responseStatus: res.statusCode,
    responseBody,
    userId,
    username,
    organizationId,
    ipAddress: getClientIp(req),
    userAgent: req.get('user-agent') || null,
    durationMs,
  };
}

/**
 * Create audit log middleware. Must be used after body-parser and before routes.
 * Logs to DB on res finish; supports public (unauthenticated) requests.
 * @param {Object} deps - { auditLogRepository }
 * @returns {import('express').RequestHandler}
 */
export function auditLogMiddleware(deps) {
  const { auditLogRepository } = deps;

  return (req, res, next) => {
    logger.debug('AuditLogMiddleware: request received', {
      method: req.method,
      url: req.originalUrl || req.url,
    });

    req._auditStartTime = Date.now();

    // Capture response body by wrapping res.json and res.send
    const originalJson = res.json.bind(res);
    const originalSend = res.send.bind(res);

    res.json = function (body) {
      res._auditResponseBody = typeof body === 'string' ? body : JSON.stringify(body);
      return originalJson(body);
    };
    res.send = function (body) {
      if (typeof body === 'object' && body !== null) {
        res._auditResponseBody = JSON.stringify(body);
      } else {
        res._auditResponseBody = body == null ? '' : String(body);
      }
      return originalSend(body);
    };

    res.on('finish', () => {
      const payload = buildAuditPayload(req, res);

      logger.debug('AuditLogMiddleware: request finished, logging audit record', {
        method: payload.method,
        path: payload.path,
        status: payload.responseStatus,
        userId: payload.userId,
        module: payload.module,
      });

      auditLogRepository.create(payload).catch((err) => {
        logger.error('AuditLogMiddleware: unexpected error when creating audit log', {
          error: err?.message,
          stack: err?.stack,
        });
      });
    });

    next();
  };
}
