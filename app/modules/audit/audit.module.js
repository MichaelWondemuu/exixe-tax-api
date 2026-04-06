/**
 * Audit module - provides middleware to log every request/response.
 * Pass the AuditLog model (from data-source) after DB is loaded.
 */
import { AuditLogRepository } from './repository/audit-log.repository.js';
import { auditLogMiddleware } from './middleware/audit-log.middleware.js';

/**
 * Create audit log middleware bound to the given model.
 * Use after body-parser; works for both authenticated and public routes.
 * @param {Object} auditLogModel - Sequelize AuditLog model (from data-source)
 * @returns {import('express').RequestHandler}
 */
export function createAuditLogMiddleware(auditLogModel) {
  const auditLogRepository = new AuditLogRepository({ auditLogModel });
  return auditLogMiddleware({ auditLogRepository });
}
