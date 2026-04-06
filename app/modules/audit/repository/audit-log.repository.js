import { logger } from '../../../shared/logger/logger.js';

/**
 * Repository for creating audit log entries.
 */
export class AuditLogRepository {
  constructor({ auditLogModel }) {
    this.auditLogModel = auditLogModel;
  }

  /**
   * Create a single audit log entry. Does not throw; logs errors.
   * @param {Object} data - Audit log fields
   * @returns {Promise<void>}
   */
  async create(data) {
    try {
      await this.auditLogModel.create(data);
      logger.debug('AuditLogRepository.create: audit log persisted', {
        path: data.path,
        method: data.method,
        status: data.responseStatus,
        userId: data.userId,
      });
    } catch (err) {
      // Log but do not throw - audit must not break the app
      logger.error('AuditLogRepository.create: failed to persist audit log', {
        error: err.message,
        stack: err.stack,
        path: data?.path,
        method: data?.method,
      });

      if (typeof process !== 'undefined' && process.emitWarning) {
        process.emitWarning(`Audit log create failed: ${err.message}`, {
          code: 'AUDIT_LOG_ERROR',
          detail: err,
        });
      }
    }
  }
}
